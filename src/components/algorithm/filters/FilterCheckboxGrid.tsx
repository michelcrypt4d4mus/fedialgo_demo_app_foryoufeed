/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import { useMemo, useState } from "react";

import tinycolor from "tinycolor2";
import { BooleanFilter, BooleanFilterName, TagWithUsageCounts, TypeFilterName, sortKeysByValue } from "fedialgo";

import FilterCheckbox from "./FilterCheckbox";
import { alphabetize } from "../../../helpers/string_helpers";
import { buildGradient } from "../../../helpers/style_helpers";
import { config, CheckboxTooltip, CheckboxColorGradient, GradientDataSource } from "../../../config";
import { getLogger } from "../../../helpers/log_helpers";
import { gridify } from '../../../helpers/react_helpers';
import { useAlgorithm } from "../../../hooks/useAlgorithm";

const HASHTAG_FILTER_CFG = config.filters.boolean.optionsFormatting[BooleanFilterName.HASHTAG];
const PARTICIPATED_TAGS_CFG = HASHTAG_FILTER_CFG.highlights[TypeFilterName.PARTICIPATED_TAGS];
const PARTICIPATED_GRADIENT_ENDPOINTS = PARTICIPATED_TAGS_CFG.highlight.gradient.endpoints;
const PARTICIPATED_GRADIENT = buildGradient(PARTICIPATED_GRADIENT_ENDPOINTS);

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
    const isHashtagFilter = (filter.title == BooleanFilterName.HASHTAG);
    const isTypeFilter = (filter.title == BooleanFilterName.TYPE);

    const trendingTagNames = new Set(algorithm.trendingData.tags.map(tag => tag.name));
    // const trendingTagNames = useMemo(
    //     () => new Set(algorithm.trendingData.tags.map(tag => tag.name)),
    //     [algorithm.trendingData.tags]
    // );
    const participatedTagNames = new Set(Object.values(algorithm.userData.participatedHashtags).map(tag => tag.name));
    // const participatedTagNames = useMemo(
    //     () => new Set(Object.values(algorithm.userData.participatedHashtags).map(tag => tag.name)),
    //     [algorithm.userData.participatedHashtags]
    // );

    const buildGradientColorArray = (dataSource: GradientDataSource): tinycolor.Instance[] => {
        const highlightCfg = Object.values(filterConfig.highlights);
        const tooltip = highlightCfg.find(c => c.highlight?.gradient?.dataSource == dataSource);

        if (!tooltip || !tooltip.highlight?.gradient) {
            logger.error(`No gradient found for dataSource: ${dataSource} in filterConfig`, filterConfig);
            return EMPTY_GRADIENT;
        }

        const gradientCfg = tooltip.highlight.gradient;
        let tags: TagWithUsageCounts[];

        if (dataSource == TypeFilterName.TRENDING_TAGS) {
            tags = algorithm.trendingData.tags;
        } else if (dataSource == TypeFilterName.PARTICIPATED_TAGS) {
            tags = Object.values(algorithm.userData.participatedHashtags);
        // } else if (gradientCfg.dataSource == TypeFilterName.FOLLOWED_HASHTAGS) {
        //     refData = algorithm.userData.followedTags;
        } else {
            logger.error(`Unknown gradient data source: ${dataSource} (${JSON.stringify(gradientCfg)})`);
            return EMPTY_GRADIENT;
        }

        const maxNumToots = Math.max(...tags.map(t => t.numToots), 2);  // Ensure at least 2 for the gradient
        let colorGradient = PARTICIPATED_GRADIENT;

        // Adjust the color gradient so there's more color variation in the low/middle range
        if (tags.length > gradientCfg.minTagsForGradientAdjust) {
            try {
                const highPctiles = gradientCfg.adjustPctiles.map(p => Math.floor(maxNumToots * p));
                const middleColors = highPctiles.map(n => colorGradient[n]).filter(Boolean);
                colorGradient = buildGradient(PARTICIPATED_GRADIENT_ENDPOINTS, middleColors);
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

    const participatedColorArray = useMemo(
        () => isHashtagFilter ? buildGradientColorArray(TypeFilterName.PARTICIPATED_TAGS) : EMPTY_GRADIENT,
        [algorithm.userData.participatedHashtags]
    );

    const findTooltip = (name: string): CheckboxTooltip | undefined => {
        if (filter.title == BooleanFilterName.HASHTAG) {
            if (name in algorithm.userData.followedTags) {
                return filterConfig.highlights[TypeFilterName.FOLLOWED_HASHTAGS];
            } else if (trendingTagNames.has(name)) {
                return filterConfig.highlights[TypeFilterName.TRENDING_TAGS];
            } else if (participatedTagNames.has(name)) {
                const numParticipations = algorithm.userData.participatedHashtags[name].numToots;
                const baseTooltip = filterConfig.highlights[TypeFilterName.PARTICIPATED_TAGS];
                let colorInstance = participatedColorArray[numParticipations - 1];

                if (!colorInstance) {
                    logger.warn(`No color found for "${name}" w/ ${numParticipations} participations`, participatedColorArray);
                    colorInstance = baseTooltip.highlight.gradient.endpoints[1];
                }

                return {
                    highlight: {color: colorInstance.toHexString()},
                    text: baseTooltip.text + ` ${numParticipations} times recently`
                };
            }
        } else if (filter.title == BooleanFilterName.LANGUAGE && name == algorithm.userData.preferredLanguage) {
            return filterConfig.highlights[BooleanFilterName.LANGUAGE];
        } else if (filter.title == BooleanFilterName.USER && name in algorithm.userData.followedAccounts) {
            return filterConfig.highlights[TypeFilterName.FOLLOWED_ACCOUNTS];
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
                url={isHashtagFilter && algorithm.tagUrl(name)}
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
            (isHashtagFilter || isTypeFilter) ? algorithm.userData.followedTags : undefined,
            (isHashtagFilter || isTypeFilter) ? algorithm.userData.participatedHashtags : undefined,
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
