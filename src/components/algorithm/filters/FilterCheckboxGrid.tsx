/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import { useMemo, useState } from "react";

import tinycolor from "tinycolor2";
import { BooleanFilter, BooleanFilterName, ScoreName, TagList, TagTootsCacheKey, TypeFilterName } from "fedialgo";

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
    tagList: TagList;
};

const EMPTY_GRADIENT: TagListColorGradient = {colors: [], tagList: new TagList([])};

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

    const buildTagListColorGradient = (dataSource: TagTootsCacheKey, tagList: TagList): TagListColorGradient => {
        const gradientCfg = filterTooltips[dataSource]?.highlight?.gradient;

        if (!gradientCfg) {
            isTagFilter && logger.warn(`No gradient found for dataSource: ${dataSource} in filterConfig`, filterConfig);
            return EMPTY_GRADIENT;
        }

        const maxNumToots = tagList.maxNumToots() || 2;  // Ensure at least 2 for the gradient
        let colorGradient = buildGradient(gradientCfg.endpoints);

        // Adjust the color gradient so there's more color variation in the low/middle range
        if (gradientCfg.adjustment && tagList.length > gradientCfg.adjustment.minTagsToAdjust) {
            try {
                const highPctiles = gradientCfg.adjustment.adjustPctiles.map(p => Math.floor(maxNumToots * p));
                const middleColors = highPctiles.map(n => colorGradient[n]).filter(Boolean);
                colorGradient = buildGradient(gradientCfg.endpoints, middleColors);
                logger.trace(`Adjusted gradient for ${dataSource} with maxNumToots=${maxNumToots}, highPctiles:`, highPctiles);
            } catch (err) {
                logger.error(`Failed to adjust gradient (maxNumToots=${maxNumToots}):`, err, `\tagList=`, tagList);
            }
        }

        const colors = colorGradient.hsv(maxNumToots, false);
        logger.trace(`Rebuilt ${gradientCfg.dataSource} with maxNumToots=${maxNumToots}, colorArray:`, colorGradient);
        return { colors, tagList };
    };

    const tagGradientInfo: GradientInfo = useMemo(
        () => Object.values(TagTootsCacheKey).reduce(
            (gradientInfos, dataSource) => {
                let tagList: TagList;

                if (dataSource == TagTootsCacheKey.PARTICIPATED_TAG_TOOTS) {
                    tagList = algorithm.userData.participatedTags;
                } else if (dataSource == TagTootsCacheKey.TRENDING_TAG_TOOTS) {
                    tagList = algorithm.trendingData.tags;
                } else if (dataSource == TagTootsCacheKey.FAVOURITED_TAG_TOOTS) {
                    tagList = algorithm.userData.favouritedTags;
                } else {
                    throw new Error(`No data for dataSource: "${dataSource}" in FilterCheckboxGrid`);
                }

                gradientInfos[dataSource] = buildTagListColorGradient(dataSource, tagList);
                return gradientInfos
            },
            {} as GradientInfo
        ),
        [algorithm.trendingData.tags, algorithm.userData.favouritedTags, algorithm.userData.participatedTags]
    );

    const getGradientColorTooltip = (tagName: string, dataSource: TagTootsCacheKey): CheckboxTooltip => {
        const { colors, tagList } = tagGradientInfo[dataSource];
        const tag = tagList.getTag(tagName);
        const baseTooltip = filterTooltips[dataSource];
        const gradientCfg = baseTooltip.highlight.gradient;

        if (!tag) {
            logger.warn(`No tag found for "${tagName}" in ${dataSource}, using default tooltip. tagList:`, tagList);
            return baseTooltip;
        }

        let color = colors[tag.numToots - 1];

        if (!color) {
            logger.warn(`No color found for "${tag.name}" w/ ${tag.numToots} toots, using default. colors:`, colors);
            color = tag.numToots ? gradientCfg.endpoints[1] : gradientCfg.endpoints[0];  // Use 1st color for 0 toots
        }

        return {
            highlight: {color: color.toHexString()},
            text: `${baseTooltip.text} ${gradientCfg.textSuffix(tag.numToots)}`,
        }
    };

    const findTooltip = (name: string): CheckboxTooltip | undefined => {
        if (filter.title == BooleanFilterName.HASHTAG) {
            if (name in algorithm.userData.followedTags) {
                return filterTooltips[TypeFilterName.FOLLOWED_HASHTAGS];
            } else if (tagGradientInfo[TagTootsCacheKey.TRENDING_TAG_TOOTS].tagList.getTag(name)) {
                return getGradientColorTooltip(name, TagTootsCacheKey.TRENDING_TAG_TOOTS);
            } else if (tagGradientInfo[TagTootsCacheKey.PARTICIPATED_TAG_TOOTS].tagList.getTag(name)) {
                return getGradientColorTooltip(name, TagTootsCacheKey.PARTICIPATED_TAG_TOOTS);
            } else if (tagGradientInfo[TagTootsCacheKey.FAVOURITED_TAG_TOOTS].tagList.getTag(name)) {
                return getGradientColorTooltip(name, TagTootsCacheKey.FAVOURITED_TAG_TOOTS);
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
