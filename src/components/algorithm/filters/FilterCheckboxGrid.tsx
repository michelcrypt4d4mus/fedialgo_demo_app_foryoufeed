/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import { useMemo, useState } from "react";

import {
    FILTER_OPTION_DATA_SOURCES,
    BooleanFilter,
    BooleanFilterName,
    ObjList,
    ScoreName,
    TagList,
    TagTootsCacheKey,
    TypeFilterName,
    type BooleanFilterOption,
    type FilterOptionDataSource,
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

type DataSourceGradients = Record<FilterOptionDataSource, CheckboxGradientTooltipConfig>;

interface FilterCheckboxGridProps {
    filter: BooleanFilter,
    highlightedOnly?: boolean,
    minToots?: number,
    showHighlights?: boolean,
    sortByCount?: boolean,
};


// TODO: maybe rename this BooleanFilterCheckboxGrid?
export default function FilterCheckboxGrid(props: FilterCheckboxGridProps) {
    const { filter, highlightedOnly, minToots, showHighlights, sortByCount } = props;
    const { algorithm } = useAlgorithm();
    const logger = useMemo(() => getLogger("FilterCheckboxGrid", filter.title), []);

    const optionsFormatCfg = config.filters.boolean.optionsFormatting[filter.title];
    const tooltipConfig = optionsFormatCfg?.tooltips || {};
    const isTagFilter = (filter.title == BooleanFilterName.HASHTAG);
    const isTypeFilter = (filter.title == BooleanFilterName.TYPE);
    const isUserFilter = (filter.title == BooleanFilterName.USER);

    // Build a dict from FilterOptionDataSource to tooltip objs with the color (or gradient) + base text
    const tooltipGradients: DataSourceGradients = useMemo(
        () => DATA_SOURCES_WITH_GRADIENT_TOOLTIPS.reduce(
            (gradients, dataSource) => {
                const baseTooltipCfg = tooltipConfig[dataSource];
                const gradientCfg = baseTooltipCfg?.highlight?.gradient;
                if (!gradientCfg) return gradients; // Skip if there's no configured gradient

                const objList = algorithm.filterOptionDataSources()[dataSource];
                const maxNumToots = Math.max(objList.maxNumToots() || 0, 2);  // Ensure at least 2 for the gradient
                let colorGradient = buildGradient(gradientCfg.endpoints);
                logger.trace(`Rebuilt ${objList.source} gradient objList.maxNumToots=${objList.maxNumToots()}`);

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

                // Add the colors array to the baseTooltipCfg
                gradients[dataSource] = {...baseTooltipCfg, colors: colorGradient.hsv(maxNumToots, false)};
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
    const getGradientTooltip = (
        option: BooleanFilterOption,
        dataSource: FilterOptionDataSource
    ): CheckboxTooltipConfig | undefined => {
        const optionGradientValue = option[dataSource];  // These props are populated in fedialgo
        if (!isNumber(optionGradientValue)) return undefined;
        const gradientCfg = tooltipGradients[dataSource];
        if (!gradientCfg) logger.logAndThrowError(`No gradientCfg found for "${dataSource}"!`);

        // Avoid negative indices with Math.max
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
        if (!showHighlights) return undefined;  // Don't show tooltips if highlights are disabled

        if (isTagFilter) {
            if (option.name in algorithm.userData.followedTags) {
                return tooltipConfig[TypeFilterName.FOLLOWED_HASHTAGS];
            }

            // Fall through to the first gradient color we have a non-zero value for in the option
            let tooltip = getGradientTooltip(option, TagTootsCacheKey.TRENDING_TAG_TOOTS);
            tooltip ||= getGradientTooltip(option, TagTootsCacheKey.PARTICIPATED_TAG_TOOTS);
            tooltip ||= getGradientTooltip(option, TagTootsCacheKey.FAVOURITED_TAG_TOOTS);
            return tooltip;
        } else if (isUserFilter && option[ScoreName.FAVOURITED_ACCOUNTS]) {
            return getGradientTooltip(option, ScoreName.FAVOURITED_ACCOUNTS);
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
                    url={isTagFilter && algorithm.tagUrl(option.name)}  // TODO: could add links for users too
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
            showHighlights,
            sortByCount,
        ]
    );

    return optionGrid;
};


function alphabetizeOptions(options: BooleanFilterOption[]): BooleanFilterOption[] {
    return options.sort((a, b) => a.name.localeCompare(b.name));
};
