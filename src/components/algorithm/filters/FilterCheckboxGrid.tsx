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
import { CheckboxTooltip, GradientDataSource } from "./FilterCheckbox";
import { config, type FilterOptionTypeTooltips } from "../../../config";
import { getLogger } from "../../../helpers/log_helpers";
import { gridify } from '../../../helpers/react_helpers';
import { useAlgorithm } from "../../../hooks/useAlgorithm";

type TagNames = ReturnType<TagList["tagNameDict"]>;

type TagColorGradient = {
    colors: tinycolor.Instance[];
    tagNames: TagNames;
};

const GRADIENT_DATA_SOURCES: GradientDataSource[] = [
    TypeFilterName.PARTICIPATED_TAGS,
    TypeFilterName.TRENDING_TAGS,
];

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
    const filterTooltips: FilterOptionTypeTooltips = filterConfig?.tooltips || {};
    const isTagFilter = (filter.title == BooleanFilterName.HASHTAG);
    const isTypeFilter = (filter.title == BooleanFilterName.TYPE);

    const buildGradientColorArray = (dataSource: GradientDataSource, tagNames: TagNames): tinycolor.Instance[] => {
        const gradientCfg = filterTooltips[dataSource]?.highlight?.gradient;

        if (!gradientCfg) {
            isTagFilter && logger.warn(`No gradient found for dataSource: ${dataSource} in filterConfig`, filterConfig);
            return EMPTY_GRADIENT;
        }

        const tags = Object.values(tagNames);
        const maxNumToots = Math.max(...tags.map(t => t.numToots), 2);  // Ensure at least 2 for the gradient
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

    const tagGradientInfo: Record<GradientDataSource, TagColorGradient> = useMemo(
        () => GRADIENT_DATA_SOURCES.reduce(
            (gradingInfos, dataSource) => {
                let tagNames: TagNames = {};

                if (dataSource == TypeFilterName.PARTICIPATED_TAGS) {
                    tagNames = algorithm.userData.participatedHashtags;
                } else if (dataSource == TypeFilterName.TRENDING_TAGS) {
                    tagNames = new TagList(algorithm.trendingData.tags).tagNameDict();
                } else {
                    throw new Error(`No data for dataSource: "${dataSource}" in FilterCheckboxGrid`);
                }

                gradingInfos[dataSource] = {
                    colors: buildGradientColorArray(dataSource, tagNames),
                    tagNames: tagNames,
                }

                return gradingInfos
            },
            {} as Record<GradientDataSource, TagColorGradient>
        ),
        [algorithm.trendingData.tags, algorithm.userData.participatedHashtags]
    );

    const getGradientColorTooltip = (tagName: string, dataSource: GradientDataSource): CheckboxTooltip => {
        const baseTooltip = filterTooltips[dataSource];
        const colors = tagGradientInfo[dataSource].colors;
        const tag = tagGradientInfo[dataSource].tagNames[tagName];

        if (!tag) {
            logger.warn(`No tag found for "${tagName}" in ${dataSource}, using default tooltip. tagNames:`, tagGradientInfo[dataSource].tagNames);
            return baseTooltip;
        }

        let color = colors[tag.numToots - 1];

        if (!color) {
            logger.warn(`No color found for "${tag.name}" w/ ${tag.numToots} toots, using default. colors:`, colors);
            color = baseTooltip.highlight.gradient.endpoints[1];
        }

        return {
            highlight: {color: color.toHexString()},
            text: `${baseTooltip.text} ${baseTooltip.highlight.gradient.textSuffix(tag.numToots)}`,
        }
    };

    const findTooltip = (name: string): CheckboxTooltip | undefined => {
        if (filter.title == BooleanFilterName.HASHTAG) {
            if (name in algorithm.userData.followedTags) {
                return filterTooltips[TypeFilterName.FOLLOWED_HASHTAGS];
            } else if (name in tagGradientInfo[TypeFilterName.TRENDING_TAGS].tagNames) {
                return getGradientColorTooltip(name, TypeFilterName.TRENDING_TAGS);
            } else if (name in tagGradientInfo[TypeFilterName.PARTICIPATED_TAGS].tagNames) {
                return getGradientColorTooltip(name, TypeFilterName.PARTICIPATED_TAGS);
            }
        } else if (filter.title == BooleanFilterName.LANGUAGE && name == algorithm.userData.preferredLanguage) {
            return filterTooltips[BooleanFilterName.LANGUAGE];
        } else if (filter.title == BooleanFilterName.USER && name in algorithm.userData.followedAccounts) {
            return filterTooltips[TypeFilterName.FOLLOWED_ACCOUNTS];
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
