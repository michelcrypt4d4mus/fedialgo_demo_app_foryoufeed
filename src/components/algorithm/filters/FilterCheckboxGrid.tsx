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
    type BooleanFilterOption,
    type UserDataSource,
} from "fedialgo";

import FilterCheckbox from "./FilterCheckbox";
import { buildGradient } from "../../../helpers/style_helpers";
import { CheckboxTooltip } from "./FilterCheckbox";
import { config, type FilterOptionTypeTooltips } from "../../../config";
import { getLogger } from "../../../helpers/log_helpers";
import { gridify } from '../../../helpers/react_helpers';
import { useAlgorithm } from "../../../hooks/useAlgorithm";

type GradientInfo = Record<TagTootsCacheKey, tinycolor.Instance[]>;

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
    const tooltipConfig: FilterOptionTypeTooltips = filterConfig?.tooltips || {};
    const isTagFilter = (filter.title == BooleanFilterName.HASHTAG);
    const isTypeFilter = (filter.title == BooleanFilterName.TYPE);
    const isUserFilter = (filter.title == BooleanFilterName.USER);

    const dataFinder: Record<UserDataSource, ObjList> = {
        [TagTootsCacheKey.PARTICIPATED_TAG_TOOTS]: algorithm.userData.participatedTags,
        [TagTootsCacheKey.TRENDING_TAG_TOOTS]: algorithm.trendingData.tags,
        [TagTootsCacheKey.FAVOURITED_TAG_TOOTS]: algorithm.userData.favouritedTags,
        [ScoreName.FAVOURITED_ACCOUNTS]: algorithm.userData.favouriteAccounts,
    };

    // Build an array of gradient colors that's as big as the maximum numToots in objList
    const buildObjListColorGradient = (objList: ObjList): tinycolor.Instance[] => {
        const dataSource = objList.source as UserDataSource;
        const gradientCfg = tooltipConfig[dataSource]?.highlight?.gradient;
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
        return colors;
    };

    // Build a dict from UserDataSource to colors, which contains the colors and the ObjList
    // that can give us a historical numToots for any objects we are trying to colorize.
    const tooltipGradients: GradientInfo = useMemo(
        // TODO: ScoreName.FAVOURITED_ACCOUNTS, ...Object.values(TagTootsCacheKey) should probably be a real enum
        () => [ScoreName.FAVOURITED_ACCOUNTS, ...Object.values(TagTootsCacheKey)].reduce(
            (gradients, dataSource) => {
                // Skip gradients that aren't configured for this filter type
                if (!tooltipConfig[dataSource]?.highlight?.gradient) return gradients;
                const objList = dataFinder[dataSource];

                if (!objList) {
                    logger.logAndThrowError(`No objList found "${dataSource}", userData:`, algorithm.userData);
                }

                gradients[dataSource] = buildObjListColorGradient(objList);
                return gradients;
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
    const getGradientColorTooltip = (option: BooleanFilterOption, dataSource: UserDataSource): CheckboxTooltip => {
        const baseTooltip = tooltipConfig[dataSource];
        if (!baseTooltip) throw new Error(`No tooltip found for "${dataSource}" in tooltipConfig!`);
        const gradientCfg = baseTooltip.highlight.gradient;
        const colors = tooltipGradients[dataSource];

        // gradientIdx is num participation, num favourites, etc. from the user history for this option
        const gradientIdx = option[dataSource] || 0;
        let color = gradientIdx ? colors[gradientIdx - 1] : gradientCfg.endpoints[0];

        if (!color) {
            logger.warn(`No color found for "${option.name}" w/ ${option.numToots} toots, using default. colors:`, colors);
            color = gradientCfg.endpoints[1];  // Assume it's a big number and deserves the top color
        }

        return {
            highlight: {color: color.toHexString()},
            text: `${baseTooltip.text} ${gradientCfg.textSuffix(gradientIdx)}`,
        }
    };

    const findTooltip = (option: BooleanFilterOption): CheckboxTooltip | undefined => {
        if (isTagFilter) {
            if (option.name in algorithm.userData.followedTags) {
                return tooltipConfig[TypeFilterName.FOLLOWED_HASHTAGS];
            } else if (option[TagTootsCacheKey.TRENDING_TAG_TOOTS]) {
                return getGradientColorTooltip(option, TagTootsCacheKey.TRENDING_TAG_TOOTS);
            } else if (option[TagTootsCacheKey.PARTICIPATED_TAG_TOOTS]) {
                return getGradientColorTooltip(option, TagTootsCacheKey.PARTICIPATED_TAG_TOOTS);
            } else if (option[TagTootsCacheKey.FAVOURITED_TAG_TOOTS]) {
                return getGradientColorTooltip(option, TagTootsCacheKey.FAVOURITED_TAG_TOOTS);
            }
        } else if (filter.title == BooleanFilterName.LANGUAGE && option.name == algorithm.userData.preferredLanguage) {
            return tooltipConfig[BooleanFilterName.LANGUAGE];
        } else if (isUserFilter) {
            if (algorithm.userData.favouriteAccounts.getObj(option.name)) {
                return getGradientColorTooltip(option, ScoreName.FAVOURITED_ACCOUNTS);
            }
        }
    };

    // Build a checkbox for a property filter. The 'name' is also the element of the filter array.
    const makeOptionCheckbox = (option: BooleanFilterOption, i: number) => {
        return (
            <FilterCheckbox
                isChecked={filter.isThisSelectionEnabled(option.name)}
                key={`${filter.title}_${option.name}_${i}`}
                label={filterConfig?.formatLabel ? filterConfig?.formatLabel(option.name) : option.name}
                onChange={(e) => filter.updateValidOptions(option.name, e.target.checked)}
                option={option}
                tooltip={findTooltip(option)}
                url={isTagFilter && algorithm.tagUrl(option.name)}
            />
        );
    };

    const optionGrid = useMemo(
        () => {
            logger.trace(`Rebuilding optionGrid for ${filter.optionInfo.length} options...`);
            let options = sortByCount ? filter.optionsSortedByValue(minToots) : filter.optionsSortedByName(minToots);
            if (highlightedOnly) options = options.filter(option => !!findTooltip(option));
            return gridify(options.objs.map((option, i) => makeOptionCheckbox(option, i)));
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


function alphabetizeOptions(options: BooleanFilterOption[]): BooleanFilterOption[] {
    return options.sort((a, b) => a.name.localeCompare(b.name));
};
