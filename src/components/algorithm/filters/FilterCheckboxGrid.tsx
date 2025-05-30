/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import { useMemo, useState } from "react";

import tinycolor from "tinycolor2";
import { BooleanFilter, BooleanFilterName, TagList, TagWithUsageCounts, TypeFilterName, sortKeysByValue } from "fedialgo";

import FilterCheckbox from "./FilterCheckbox";
import { alphabetize } from "../../../helpers/string_helpers";
import { buildGradient } from "../../../helpers/style_helpers";
import { config } from "../../../config";
import { CheckboxTooltip, GradientDataSource } from "./FilterCheckbox";
import { getLogger } from "../../../helpers/log_helpers";
import { gridify } from '../../../helpers/react_helpers';
import { useAlgorithm } from "../../../hooks/useAlgorithm";

type TagNames = ReturnType<TagList["tagNameDict"]>;
const EMPTY_GRADIENT: tinycolor.Instance[] = [];

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
    const isTagFilter = (filter.title == BooleanFilterName.HASHTAG);
    const isTypeFilter = (filter.title == BooleanFilterName.TYPE);

    const hashtagDataSources: Record<GradientDataSource, TagNames> = useMemo(
        () => ({
            [TypeFilterName.PARTICIPATED_TAGS]: isTagFilter ? algorithm.userData.participatedHashtags : {},
            [TypeFilterName.TRENDING_TAGS]: isTagFilter ? new TagList(algorithm.trendingData.tags).tagNameDict() : {},
        }),
        [algorithm.userData.participatedHashtags, algorithm.trendingData.tags]
    );

    const buildGradientColorArray = (dataSource: GradientDataSource): tinycolor.Instance[] => {
        const highlightCfg = Object.values(filterConfig.tooltips);
        const tooltip = highlightCfg.find(c => c.highlight?.gradient?.dataSource == dataSource);

        if (!tooltip || !tooltip.highlight?.gradient) {
            logger.error(`No gradient found for dataSource: ${dataSource} in filterConfig`, filterConfig);
            return EMPTY_GRADIENT;
        }

        const tags = Object.values(hashtagDataSources[dataSource]);
        const maxNumToots = Math.max(...tags.map(t => t.numToots), 2);  // Ensure at least 2 for the gradient
        const gradientCfg = tooltip.highlight.gradient;
        let colorGradient = buildGradient(gradientCfg.endpoints);

        // Adjust the color gradient so there's more color variation in the low/middle range
        if (gradientCfg.minTagsForGradientAdjust && tags.length > gradientCfg.minTagsForGradientAdjust) {
            try {
                const highPctiles = gradientCfg.adjustPctiles.map(p => Math.floor(maxNumToots * p));
                const middleColors = highPctiles.map(n => colorGradient[n]).filter(Boolean);
                colorGradient = buildGradient(gradientCfg.endpoints, middleColors);
            } catch (err) {
                logger.error(
                    `Failed to adjust gradient colorArray (maxParticipations=${maxNumToots}):`, err,
                    `\refData=`, tags, `, `
                );
            }
        }

        const colorArray = colorGradient.hsv(maxNumToots, false);
        logger.trace(`Rebuilt ${gradientCfg.dataSource} with maxNumToots=${maxNumToots}, colorArray:`, colorGradient);
        return colorArray;
    };

    const participatedTagColors = useMemo(
        () => isTagFilter ? buildGradientColorArray(TypeFilterName.PARTICIPATED_TAGS) : EMPTY_GRADIENT,
        [algorithm.userData.participatedHashtags]
    );

    const trendingTagColors = useMemo(
        () => isTagFilter ? buildGradientColorArray(TypeFilterName.TRENDING_TAGS) : EMPTY_GRADIENT,
        [algorithm.trendingData.tags]
    );

    const getGradientColorForTag = (
        tag: TagWithUsageCounts,
        colors: tinycolor.Instance[],
        defaultColor: tinycolor.Instance
    ): tinycolor.Instance => {
        let colorInstance = colors[tag.numToots - 1];

        if (!colorInstance) {
            logger.warn(`No color found for "${tag.name}" w/ ${tag.numToots} toots`, colors);
            colorInstance = defaultColor;;
        }

        return colorInstance;
    };

    const findTooltip = (name: string): CheckboxTooltip | undefined => {
        if (filter.title == BooleanFilterName.HASHTAG) {
            if (name in algorithm.userData.followedTags) {
                return filterConfig.tooltips[TypeFilterName.FOLLOWED_HASHTAGS];
            } else if (name in hashtagDataSources[TypeFilterName.TRENDING_TAGS]) {
                const tag = hashtagDataSources[TypeFilterName.TRENDING_TAGS][name];
                const baseTooltip = filterConfig.tooltips[TypeFilterName.TRENDING_TAGS];
                const defaultColor = baseTooltip.highlight.gradient.endpoints[1];

                return {
                    highlight: {color: getGradientColorForTag(tag, trendingTagColors, defaultColor).toHexString()},
                    text: baseTooltip.text + ` (${tag.numToots} recent toots)`,
                };
            } else if (name in hashtagDataSources[TypeFilterName.PARTICIPATED_TAGS]) {
                const tag = hashtagDataSources[TypeFilterName.PARTICIPATED_TAGS][name];
                const baseTooltip = filterConfig.tooltips[TypeFilterName.PARTICIPATED_TAGS];
                const defaultColor = baseTooltip.highlight.gradient.endpoints[1];

                return {
                    highlight: {color: getGradientColorForTag(tag, participatedTagColors, defaultColor).toHexString()},
                    text: baseTooltip.text + ` ${tag.numToots} times recently`
                };
            }
        } else if (filter.title == BooleanFilterName.LANGUAGE && name == algorithm.userData.preferredLanguage) {
            return filterConfig.tooltips[BooleanFilterName.LANGUAGE];
        } else if (filter.title == BooleanFilterName.USER && name in algorithm.userData.followedAccounts) {
            return filterConfig.tooltips[TypeFilterName.FOLLOWED_ACCOUNTS];
        }
    };

    // Build a checkbox for a property filter. The 'name' is also the element of the filter array.
    const propertyCheckbox = (name: string, i: number) => {
        return (
            <FilterCheckbox
                isChecked={filter.isThisSelectionEnabled(name)}
                key={`${filter.title}_${name}_${i}`}
                label={filterConfig?.labelMapper ? filterConfig?.labelMapper(name) : name}
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
            let optionInfo = {...filter.optionInfo};

            // For filters w/many options only show choices with a min # of toots + already selected options
            if (minToots) {
                optionInfo = Object.fromEntries(
                    Object.entries(optionInfo).filter(
                        ([optionName, numToots]) => {
                            if (filter.isThisSelectionEnabled(optionName)) return true;  // Always show selected options

                            if (numToots >= minToots) {
                                return (highlightedOnly ? !!findTooltip(optionName) : true);
                            } else {
                                return false;
                            }
                        }
                    )
                );
            }

            const optionKeys = sortByCount ? sortKeysByValue(optionInfo) : alphabetize(Object.keys(optionInfo));
            return gridify(optionKeys.map((option, i) => propertyCheckbox(option, i)));
        },
        [
            // Not all filters need to watch all values in userData, so we only watch the ones that are relevant
            (isTagFilter || isTypeFilter) ? algorithm.userData.followedTags : undefined,
            (isTagFilter || isTypeFilter) ? algorithm.userData.participatedHashtags : undefined,
            (filter.title == BooleanFilterName.LANGUAGE) ? algorithm.userData.preferredLanguage : undefined,
            (filter.title == BooleanFilterName.USER) || isTypeFilter ? algorithm.userData.followedAccounts : undefined,
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
