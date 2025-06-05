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
    ScoreName,
    TagTootsCacheKey,
    TypeFilterName,
    type BooleanFilterOption,
    type FilterOptionDataSource,
} from "fedialgo";

import FilterCheckbox from "./FilterCheckbox";
import { buildGradient } from "../../../helpers/style_helpers";
import { config } from "../../../config";
import { getLogger } from "../../../helpers/log_helpers";
import { gridify } from '../../../helpers/react_helpers';
import { isNumber } from "../../../helpers/number_helpers";
import { useAlgorithm } from "../../../hooks/useAlgorithm";
import { type CheckboxGradientTooltipConfig, type CheckboxTooltipConfig } from '../../../helpers/tooltip_helpers';
import { type HeaderSwitchState } from "../BooleanFilterAccordionSection";

type DataSourceGradients = Record<FilterOptionDataSource, CheckboxGradientTooltipConfig>;

interface FilterCheckboxGridProps extends HeaderSwitchState {
    filter: BooleanFilter,
    minToots?: number,
};


// TODO: maybe rename this BooleanFilterCheckboxGrid?
export default function FilterCheckboxGrid(props: FilterCheckboxGridProps) {
    const { filter, highlightsOnly, minToots, sortByCount } = props;
    const { algorithm, hideFilterHighlights } = useAlgorithm();
    const logger = useMemo(() => getLogger("FilterCheckboxGrid", filter.title), []);

    const optionsFormatCfg = config.filters.boolean.optionsFormatting[filter.title];
    const tooltipConfig = optionsFormatCfg?.tooltips || {};
    const isTagFilter = (filter.title == BooleanFilterName.HASHTAG);
    const isTypeFilter = (filter.title == BooleanFilterName.TYPE);
    const isUserFilter = (filter.title == BooleanFilterName.USER);

    // Build a dict from FilterOptionDataSource to tooltip objs with the color (or gradient) + base text
    const tooltipGradients: DataSourceGradients = useMemo(
        () => FILTER_OPTION_DATA_SOURCES.reduce(
            (gradients, dataSource) => {
                const baseTooltipCfg = tooltipConfig[dataSource];
                const gradientCfg = baseTooltipCfg?.highlight?.gradient;
                if (!gradientCfg) return gradients; // Skip if there's no configured gradient

                // Ensure at least 2 for the gradient
                const maxValue = Math.max(filter.options.maxValue(dataSource) || 0, 2);
                let colorGradient = buildGradient(gradientCfg.endpoints);

                // Adjust the color gradient so there's more color variation in the low/middle range
                if (gradientCfg.adjustment && filter.options.length > gradientCfg.adjustment.minTagsToAdjust) {
                    try {
                        const highPctiles = gradientCfg.adjustment.adjustPctiles.map(p => Math.floor(maxValue * p));
                        const middleColors = highPctiles.map(n => colorGradient[n]).filter(Boolean);
                        colorGradient = buildGradient(gradientCfg.endpoints, middleColors);
                        logger.deep(`Adjusted ${dataSource} gradient, maxValue=${maxValue}`);
                    } catch (err) {
                        logger.error(`Failed to adjust ${dataSource} gradient w/maxValue=${maxValue}):`, err);
                    }
                }

                // Add the colors array to the baseTooltipCfg
                gradients[dataSource] = {...baseTooltipCfg, colors: colorGradient.hsv(maxValue, false)};
                logger.trace(`Rebuilt ${filter.title} gradient, maxValue=${maxValue}`);
                return gradients;
            },
            {} as DataSourceGradients
        ),
        [filter.options]
    );

    // Get the color & text for the tooltip based on the number stored in the option prop w/name same as dataSource param
    // Returns null if the option doesn't have a number for that dataSource.
    const getGradientTooltip = (
        option: BooleanFilterOption,
        dataSource: FilterOptionDataSource
    ): CheckboxTooltipConfig | undefined => {
        const optionGradientValue = option[dataSource];  // The value driving the gradient, e.g. num favourites
        if (!isNumber(optionGradientValue)) return undefined;
        const gradientCfg = tooltipGradients[dataSource];
        if (!gradientCfg) logger.logAndThrowError(`No gradientCfg found for "${dataSource}"!`);

        let color = gradientCfg.colors[Math.max(optionGradientValue, 1) - 1];  // Math.max() to avoid negative indices

        if (!color) {
            logger.warn(`No color found for option (dataSource="${dataSource}", gradient color array has ${gradientCfg.colors?.length} elements):`, option);
            color = gradientCfg.highlight.gradient.endpoints[1];  // Use the top color
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
        if (hideFilterHighlights) return undefined;

        if (isTagFilter) {
            if (option.isFollowed) {
                return tooltipConfig[TypeFilterName.FOLLOWED_HASHTAGS];
            }

            // Fall through to the first gradient color we have a non-zero value for in the option
            let tooltip = getGradientTooltip(option, TagTootsCacheKey.TRENDING_TAG_TOOTS);
            tooltip ||= getGradientTooltip(option, TagTootsCacheKey.PARTICIPATED_TAG_TOOTS);
            tooltip ||= getGradientTooltip(option, TagTootsCacheKey.FAVOURITED_TAG_TOOTS);
            return tooltip;
        } else if (isUserFilter) {
            const dataSource = ScoreName.FAVOURITED_ACCOUNTS;
            if (!isNumber(option[dataSource])) return undefined;
            let tooltip = getGradientTooltip(option, dataSource);
            const userTooltipCfg = tooltipConfig[dataSource];

            if (!tooltip) {
                logger.warn(`Didn't find a tooltip where we expected to find one for option:`, option);
                return undefined;
            }

            // If it's a followed account w/interactions turn gradient to max, otherwise halfway to max
            if (option.isFollowed) {
                if (option[dataSource] > 0) {
                    tooltip.highlight.color = userTooltipCfg.highlight.gradient.endpoints[1].toHexString();
                } else {
                    const gradientColors = tooltipGradients[dataSource].colors;
                    tooltip.highlight.color = gradientColors[Math.ceil(gradientColors.length / 2)].toHexString();
                }
            } else {
                tooltip.text = tooltip.text.replace(`${userTooltipCfg.text} and i`, "I");
            }

            return tooltip;
        } else if (filter.title == BooleanFilterName.LANGUAGE) {
            const dataSource = BooleanFilterName.LANGUAGE;
            if (!isNumber(option[dataSource])) return undefined;
            let tooltip = getGradientTooltip(option, dataSource);
            return tooltip;
        }
    };

    const optionGrid = useMemo(
        () => {
            logger.trace(`Rebuilding optionGrid for ${filter.options.length} options...`);
            let options = sortByCount ? filter.optionsSortedByValue(minToots) : filter.optionsSortedByName(minToots);

            if (highlightsOnly && !hideFilterHighlights) {
                options = options.filter(option => !!findTooltip(option));
            }

            const optionCheckboxes = options.objs.map((option, i) => {
                const label = option.displayName || option.name;

                return (
                    <FilterCheckbox
                        isChecked={filter.isOptionEnabled(option.name)}
                        key={`${filter.title}_${option.name}_${i}`}
                        label={optionsFormatCfg?.formatLabel ? optionsFormatCfg?.formatLabel(label) : label}
                        onChange={(e) => filter.updateOption(option.name, e.target.checked)}
                        option={option}
                        tooltip={findTooltip(option)}
                        url={isTagFilter && algorithm.tagUrl(option.name)}  // TODO: could add links for users too
                    />
                );
            });

            return gridify(optionCheckboxes);
        },
        [
            filter.options,
            filter.selectedOptions,
            tooltipGradients,
            hideFilterHighlights,
            highlightsOnly,
            minToots,
            sortByCount,
        ]
    );

    return optionGrid;
};
