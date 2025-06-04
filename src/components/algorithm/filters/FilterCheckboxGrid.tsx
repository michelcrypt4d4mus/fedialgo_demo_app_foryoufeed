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
                        logger.deep(`Adjusted ${dataSource} gradient, maxNumToots=${maxNumToots}`);
                    } catch (err) {
                        logger.error(`Failed to adjust ${dataSource} gradient w/maxNumToots=${maxNumToots}):`, err);
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
        const optionGradientValue = option[dataSource];  // The value driving the gradient, e.g. num favourites
        if (!isNumber(optionGradientValue)) return undefined;
        const gradientCfg = tooltipGradients[dataSource];
        if (!gradientCfg) logger.logAndThrowError(`No gradientCfg found for "${dataSource}"!`);

        let color = gradientCfg.colors[Math.max(optionGradientValue, 1) - 1];  // Math.max() to avoid negative indices

        if (!color) {
            logger.warn(`No color found for option:`, option);
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
            if (option.name in algorithm.userData.followedTags) {
                return tooltipConfig[TypeFilterName.FOLLOWED_HASHTAGS];
            }

            // Fall through to the first gradient color we have a non-zero value for in the option
            let tooltip = getGradientTooltip(option, TagTootsCacheKey.TRENDING_TAG_TOOTS);
            tooltip ||= getGradientTooltip(option, TagTootsCacheKey.PARTICIPATED_TAG_TOOTS);
            tooltip ||= getGradientTooltip(option, TagTootsCacheKey.FAVOURITED_TAG_TOOTS);
            return tooltip;
        } else if (isUserFilter && isNumber(option[ScoreName.FAVOURITED_ACCOUNTS])) {
            return getGradientTooltip(option, ScoreName.FAVOURITED_ACCOUNTS);
        } else if (filter.title == BooleanFilterName.LANGUAGE) {
            const languageOption = algorithm.userData.languagesPostedIn.getObj(option.name);

            if (option.name == algorithm.userData.preferredLanguage) {
                return tooltipConfig[BooleanFilterName.LANGUAGE];
            } else if (languageOption) {
                // TODO: use a gradient?
                const tooltip = {...tooltipConfig[BooleanFilterName.LANGUAGE]};
                tooltip.text = `You used this language ${languageOption.numToots} times recently`;
                return tooltip;
            }
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
            // Not all filters need to watch all values in userData, so we only watch the ones that are relevant
            (isTagFilter || isTypeFilter) ? algorithm.userData.followedTags : undefined,
            (isTagFilter || isTypeFilter) ? algorithm.userData.participatedTags : undefined,
            (filter.title == BooleanFilterName.LANGUAGE) ? algorithm.userData.preferredLanguage : undefined,
            (isUserFilter || isTypeFilter) ? algorithm.userData.followedAccounts : undefined,
            isUserFilter ? algorithm.userData.favouriteAccounts : undefined,
            filter,
            filter.options,
            filter.selectedOptions,
            hideFilterHighlights,
            highlightsOnly,
            minToots,
            sortByCount,
        ]
    );

    // if (this.title == BooleanFilterName.USER) {
        // for (let i = 0; i < filter.options.objs.length; i++) {
        //     if (filter.options.objs[i].displayName) {
        //         logger.info(`Found obj with displayName:`, filter.options.objs[i]);
        //     }
        // }
    // }

    return optionGrid;
};
