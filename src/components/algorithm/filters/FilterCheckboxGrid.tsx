/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import { useMemo, useState } from "react";

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
import { CheckboxTooltipConfig } from "../../../config";
import { config, type CheckboxGradientTooltipConfig } from "../../../config";
import { getLogger } from "../../../helpers/log_helpers";
import { gridify } from '../../../helpers/react_helpers';
import { isNumber } from "../../../helpers/number_helpers";
import { useAlgorithm } from "../../../hooks/useAlgorithm";

const DATA_SOURCES_WITH_GRADIENT_TOOLTIPS = [
    ...Object.values(TagTootsCacheKey),
    ScoreName.FAVOURITED_ACCOUNTS,
] as const;

type DataSource = typeof DATA_SOURCES_WITH_GRADIENT_TOOLTIPS[number];
type DataSourceGradients = Record<UserDataSource, CheckboxGradientTooltipConfig>;

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

    const optionsFormatCfg = config.filters.boolean.optionsFormatting[filter.title];
    const tooltipConfig = optionsFormatCfg?.tooltips || {};
    const isTagFilter = (filter.title == BooleanFilterName.HASHTAG);
    const isTypeFilter = (filter.title == BooleanFilterName.TYPE);
    const isUserFilter = (filter.title == BooleanFilterName.USER);

    const dataFinder: Record<DataSource, ObjList> = {
        [TagTootsCacheKey.PARTICIPATED_TAG_TOOTS]: algorithm.userData.participatedTags,
        [TagTootsCacheKey.TRENDING_TAG_TOOTS]: algorithm.trendingData.tags,
        [TagTootsCacheKey.FAVOURITED_TAG_TOOTS]: algorithm.userData.favouritedTags,
        [ScoreName.FAVOURITED_ACCOUNTS]: algorithm.userData.favouriteAccounts,
    };

    // Build an array of gradient colors that's as big as the maximum numToots in objList
    const buildColorGradientTooltipCfg = (objList: ObjList): CheckboxGradientTooltipConfig | null => {
        const dataSource = objList.source as UserDataSource;
        const baseTooltipCfg = tooltipConfig[dataSource];
        const gradientCfg = baseTooltipCfg?.highlight?.gradient;
        if (!gradientCfg) return null;

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

        logger.trace(`Rebuilt ${objList.source} gradient objList.maxNumToots=${objList.maxNumToots()}`);

        return {
            ...baseTooltipCfg,
            colors: colorGradient.hsv(maxNumToots, false),  // Add the colors array to the baseTooltip
        };
    };

    // Build a dict from UserDataSource to colors, which contains the colors and the ObjList
    // that can give us a historical numToots for any objects we are trying to colorize.
    const tooltipGradients: DataSourceGradients = useMemo(
        () => DATA_SOURCES_WITH_GRADIENT_TOOLTIPS.reduce(
            (gradients, dataSource) => {
                const gradientCfg = buildColorGradientTooltipCfg(dataFinder[dataSource]);

                if (gradientCfg) {
                    gradients[dataSource] = gradientCfg;
                } else {
                    logger.trace(`No gradient config found for "${dataSource}", probably not configured for this filter...`);
                }

                return gradients;
            },
            {} as DataSourceGradients
        ),
        [
            algorithm.trendingData.tags,
            algorithm.userData.favouriteAccounts,
            algorithm.userData.favouritedTags,
            algorithm.userData.participatedTags
        ]
    );

    // Get the color & text for the tooltip based on the number stored in the option prop w/name same as dataSource param
    // Returns null if the option doesn't have a number for that dataSource.
    const getGradientColorTooltip = (option: BooleanFilterOption, dataSource: UserDataSource): CheckboxTooltipConfig | undefined => {
        const optionGradientValue = option[dataSource];  // Pre-populated in fedialgo
        if (!isNumber(optionGradientValue)) return undefined;
        const gradientCfg = tooltipGradients[dataSource];
        if (!gradientCfg) logger.logAndThrowError(`No gradientCfg found for "${dataSource}"!`);

        // Avoid negative indices
        let color = gradientCfg.colors[Math.max(optionGradientValue, 1) - 1];

        if (!color) {
            logger.warn(`No color found for "${option.name}" w/ ${option.numToots} toots, using default. gradientCfg:`, gradientCfg);
            color = gradientCfg.highlight.gradient.endpoints[0];  // Assume it's a big number and deserves the top color
        }

        return {
            highlight: {
                color: color.toHexString()
            },
            text: `${gradientCfg.text} ${gradientCfg.highlight.gradient.textSuffix(optionGradientValue)}`,
        }
    };

    // Return a finalized CheckboxTooltipConfig with full text and color for the option
    const findTooltip = (option: BooleanFilterOption): CheckboxTooltipConfig | undefined => {
        if (isTagFilter) {
            if (option.name in algorithm.userData.followedTags) {
                return tooltipConfig[TypeFilterName.FOLLOWED_HASHTAGS];
            }

            // Fall through to the first gradient color we have a non-zero value for in the option
            let tooltip = getGradientColorTooltip(option, TagTootsCacheKey.TRENDING_TAG_TOOTS);
            tooltip ||= getGradientColorTooltip(option, TagTootsCacheKey.PARTICIPATED_TAG_TOOTS);
            tooltip ||= getGradientColorTooltip(option, TagTootsCacheKey.FAVOURITED_TAG_TOOTS);
            return tooltip;
        } else if (isUserFilter && option[ScoreName.FAVOURITED_ACCOUNTS]) {
            return getGradientColorTooltip(option, ScoreName.FAVOURITED_ACCOUNTS);
        } else if (filter.title == BooleanFilterName.LANGUAGE && option.name == algorithm.userData.preferredLanguage) {
            return tooltipConfig[BooleanFilterName.LANGUAGE];
        }
    };

    const optionGrid = useMemo(
        () => {
            logger.trace(`Rebuilding optionGrid for ${filter.optionInfo.length} options...`);
            let options = sortByCount ? filter.optionsSortedByValue(minToots) : filter.optionsSortedByName(minToots);
            if (highlightedOnly) options = options.filter(option => !!findTooltip(option));

            const optionCheckboxes = options.objs.map((option, i) => (
                <FilterCheckbox
                    isChecked={filter.isThisSelectionEnabled(option.name)}
                    key={`${filter.title}_${option.name}_${i}`}
                    label={optionsFormatCfg?.formatLabel ? optionsFormatCfg?.formatLabel(option.name) : option.name}
                    onChange={(e) => filter.updateValidOptions(option.name, e.target.checked)}
                    option={option}
                    tooltip={findTooltip(option)}
                    url={isTagFilter && algorithm.tagUrl(option.name)}
                />
            ));

            return gridify(optionCheckboxes);
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
