/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import { useMemo, useState } from "react";

import tinycolor from "tinycolor2";
import {
    BooleanFilter,
    BooleanFilterName,
    ObjList,
    ScoreName,
    TagTootsCacheKey,
    TypeFilterName,
    type UserDataSource,
} from "fedialgo";

import FilterCheckbox from "./FilterCheckbox";
import { alphabetize } from "../../../helpers/string_helpers";
import { buildGradient } from "../../../helpers/style_helpers";
import { CheckboxTooltip } from "./FilterCheckbox";
import { config, type FilterOptionTypeTooltips } from "../../../config";
import { getLogger } from "../../../helpers/log_helpers";
import { gridify } from '../../../helpers/react_helpers';
import { useAlgorithm } from "../../../hooks/useAlgorithm";

type GradientInfo = Record<TagTootsCacheKey, TagListColorGradient>;

type TagListColorGradient = {
    colors: tinycolor.Instance[];
    objList: ObjList;
};

interface FilterCheckboxGridProps {
    filter: BooleanFilter,
    highlightedOnly?: boolean,
    minToots?: number,
    sortByCount?: boolean,
};


// TODO: maybe rename this BooleanFilterCheckboxGrid?
export default function FilterCheckboxGrid(props: FilterCheckboxGridProps) {
    const { filter, highlightedOnly, minToots, sortByCount } = props;
    const { algorithm } = useAlgorithm();

    const logger = useMemo(() => getLogger("FilterCheckboxGrid", filter.title), []);
    const filterConfig = config.filters.boolean.optionsFormatting[filter.title];
    const filterTooltips: FilterOptionTypeTooltips = filterConfig?.tooltips || {};
    const isTagFilter = (filter.title == BooleanFilterName.HASHTAG);
    const isTypeFilter = (filter.title == BooleanFilterName.TYPE);
    const isUserFilter = (filter.title == BooleanFilterName.USER);

    const buildObjListColorGradient = (objList: ObjList): TagListColorGradient => {
        const dataSource = objList.source as UserDataSource;
        const gradientCfg = filterTooltips[dataSource]?.highlight?.gradient;
        if (!gradientCfg) throw new Error(`No gradientCfg found for dataSource: ${dataSource} in filterConfig`);
        if (!objList?.source) logger.logAndThrowError(`No source found for objList: ${objList} in filterConfig`, objList);
        const maxNumToots = Math.max(objList.maxNumToots() || 0, 2);  // Ensure at least 2 for the gradient
        let colorGradient = buildGradient(gradientCfg.endpoints);

        // Adjust the color gradient so there's more color variation in the low/middle range
        if (gradientCfg.adjustment && objList.length > gradientCfg.adjustment.minTagsToAdjust) {
            try {
                const highPctiles = gradientCfg.adjustment.adjustPctiles.map(p => Math.floor(maxNumToots * p));
                const middleColors = highPctiles.map(n => colorGradient[n]).filter(Boolean);
                colorGradient = buildGradient(gradientCfg.endpoints, middleColors);
                logger.deep(`Adjusted ${dataSource} gradient, maxNumToots=${maxNumToots}, highPctiles:`, highPctiles);
            } catch (err) {
                logger.error(`Failed to adjust ${dataSource} gradient w/maxNumToots=${maxNumToots}):`, err, `\objList=`, objList);
            }
        }

        const colors = colorGradient.hsv(maxNumToots, false);
        logger.trace(`Rebuilt ${gradientCfg.dataSource}. objList.maxNumToots=${objList.maxNumToots()}, colorArray:`, colors);
        return { colors, objList };
    };

    // Build a dict from UserDataSource to TagListColorGradient, which contains the colors and the ObjList
    // that can give us a historical numToots for any objects we are trying to colorize.
    const tooltipGradientInfo: GradientInfo = useMemo(
        () => [ScoreName.FAVOURITED_ACCOUNTS, ...Object.values(TagTootsCacheKey)].reduce(
            (gradientInfos, dataSource) => {
                // Skip gradients that aren't configured for this filter type
                if (!filterTooltips[dataSource]?.highlight?.gradient) return gradientInfos;
                let objList: ObjList;

                if (dataSource == TagTootsCacheKey.PARTICIPATED_TAG_TOOTS) {
                    objList = algorithm.userData.participatedTags;
                } else if (dataSource == TagTootsCacheKey.TRENDING_TAG_TOOTS) {
                    objList = algorithm.trendingData.tags;
                } else if (dataSource == TagTootsCacheKey.FAVOURITED_TAG_TOOTS) {
                    objList = algorithm.userData.favouritedTags;
                } else if (dataSource == ScoreName.FAVOURITED_ACCOUNTS) {
                    objList = algorithm.userData.favouriteAccounts;
                }

                if (!objList) {
                    logger.logAndThrowError(`No objList found "${dataSource}", userData:`, algorithm.userData);
                }

                gradientInfos[dataSource] = buildObjListColorGradient(objList);
                return gradientInfos;
            },
            {} as GradientInfo
        ),
        [
            algorithm.trendingData.tags,
            algorithm.userData.favouriteAccounts,
            algorithm.userData.favouritedTags,
            algorithm.userData.participatedTags
        ]
    );

    // Get the actual color for the checkbox tooltip, based on the numToots
    const getGradientColorTooltip = (objName: string, dataSource: UserDataSource): CheckboxTooltip => {
        const { colors, objList } = tooltipGradientInfo[dataSource];
        const obj = objList.getObj(objName);
        const baseTooltip = filterTooltips[dataSource];
        if (!baseTooltip) throw new Error(`No tooltip found for "${dataSource}" in filterTooltips!`);

        if (dataSource == ScoreName.FAVOURITED_ACCOUNTS && !algorithm.userData.followedAccounts[objName]) {
            logger.debug(`Colouring non-followed account: "${objName}"`);
        }

        if (!obj) {
            logger.warn(`No gradient found for "${objName}" in ${dataSource}, using default tooltip:`, baseTooltip);
            return baseTooltip;
        }

        const gradientCfg = baseTooltip.highlight.gradient;
        let color = obj.numToots > 0 ? colors[obj.numToots - 1] : gradientCfg.endpoints[0];

        if (!color) {
            logger.warn(`No color found for "${obj.name}" w/ ${obj.numToots} toots, using default. colors:`, colors);
            color = gradientCfg.endpoints[1];  // Assume it's a big number and deserves the top color
        }

        return {
            highlight: {color: color.toHexString()},
            text: `${baseTooltip.text} ${gradientCfg.textSuffix(obj.numToots)}`,
        }
    };

    const findTooltip = (name: string): CheckboxTooltip | undefined => {
        if (isTagFilter) {
            if (name in algorithm.userData.followedTags) {
                return filterTooltips[TypeFilterName.FOLLOWED_HASHTAGS];
            } else if (tooltipGradientInfo[TagTootsCacheKey.TRENDING_TAG_TOOTS].objList.getObj(name)) {
                return getGradientColorTooltip(name, TagTootsCacheKey.TRENDING_TAG_TOOTS);
            } else if (tooltipGradientInfo[TagTootsCacheKey.PARTICIPATED_TAG_TOOTS].objList.getObj(name)) {
                return getGradientColorTooltip(name, TagTootsCacheKey.PARTICIPATED_TAG_TOOTS);
            } else if (tooltipGradientInfo[TagTootsCacheKey.FAVOURITED_TAG_TOOTS].objList.getObj(name)) {
                return getGradientColorTooltip(name, TagTootsCacheKey.FAVOURITED_TAG_TOOTS);
            }
        } else if (filter.title == BooleanFilterName.LANGUAGE && name == algorithm.userData.preferredLanguage) {
            return filterTooltips[BooleanFilterName.LANGUAGE];
        } else if (isUserFilter) {
            if (algorithm.userData.favouriteAccounts.getObj(name)) {
                return getGradientColorTooltip(name, ScoreName.FAVOURITED_ACCOUNTS);
            }
        }
    };

    // Build a checkbox for a property filter. The 'name' is also the element of the filter array.
    const propertyCheckbox = (name: string, i: number) => {
        return (
            <FilterCheckbox
                isChecked={filter.isThisSelectionEnabled(name)}
                key={`${filter.title}_${name}_${i}`}
                label={filterConfig?.formatLabel ? filterConfig?.formatLabel(name) : name}
                labelExtra={filter.optionInfo[name]}
                onChange={(e) => filter.updateValidOptions(name, e.target.checked)}
                tooltip={findTooltip(name)}
                url={isTagFilter && algorithm.tagUrl(name)}
            />
        );
    };

    const optionGrid = useMemo(
        () => {
            logger.trace(`Rebuilding optionGrid for ${Object.keys(filter.optionInfo).length} options...`);
            let optionKeys = filter.optionsSortedByValue(minToots);
            if (highlightedOnly) optionKeys = optionKeys.filter(name => findTooltip(name));
            if (!sortByCount) optionKeys = alphabetize(optionKeys);
            return gridify(optionKeys.map((option, i) => propertyCheckbox(option, i)));
        },
        [
            // Not all filters need to watch all values in userData, so we only watch the ones that are relevant
            (isTagFilter || isTypeFilter) ? algorithm.userData.followedTags : undefined,
            (isTagFilter || isTypeFilter) ? algorithm.userData.participatedTags : undefined,
            (filter.title == BooleanFilterName.LANGUAGE) ? algorithm.userData.preferredLanguage : undefined,
            (isUserFilter || isTypeFilter) ? algorithm.userData.followedAccounts : undefined,
            isUserFilter ? algorithm.userData.favouriteAccounts : undefined,
            filter.optionInfo,
            filter.title,
            filter.validValues,
            highlightedOnly,
            minToots,
            sortByCount,
        ]
    );

    return optionGrid;
};
