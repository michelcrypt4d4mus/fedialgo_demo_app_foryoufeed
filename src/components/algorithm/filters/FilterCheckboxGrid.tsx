/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import { useMemo, useState } from "react";

import tinycolor from "tinycolor2";
import tinygradient from "tinygradient";
import { BooleanFilter, BooleanFilterName, TypeFilterName, sortKeysByValue } from "fedialgo";

import FilterCheckbox from "./FilterCheckbox";
import { alphabetize } from "../../../helpers/string_helpers";
import { config, CheckboxTooltip, FilterGridConfig } from "../../../config";
import { getLogger } from "../../../helpers/log_helpers";
import { gridify } from '../../../helpers/react_helpers';
import { useAlgorithm } from "../../../hooks/useAlgorithm";

const TOOLTIPS = config.tooltips.filterOptionsTooltips;
const GRADIENT_ENDPOINTS =  [config.theme.participatedTagColorMin, config.theme.participatedTagColor].map(t => tinycolor(t));
const PARTICIPATED_GRADIENT = participatedGradient();
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
    logger.log(`Rendering, PARTICIPATED_GRADIENT is:`, PARTICIPATED_GRADIENT);
    const filterConfig: FilterGridConfig | undefined = config.filters.boolean.optionsList[filter.title];
    const isHashtagFilter = (filter.title == BooleanFilterName.HASHTAG);
    const isTypeFilter = (filter.title == BooleanFilterName.TYPE);

    const trendingTagNames = useMemo(
        () => new Set(algorithm.trendingData.tags.map(tag => tag.name)),
        [algorithm.trendingData.tags]
    );

    const participatedColorArray = useMemo(
        () => {
            // Only hashtags use the gradient. Return same EMPTY_GRADIENT object to avoid triggering re-rendering.
            if (!isHashtagFilter) return EMPTY_GRADIENT;

            const participatedTags = Object.values(algorithm.userData.participatedHashtags);
            const maxParticipations = Math.max(...participatedTags.map(t => t.numToots), 2);  // Ensure at least 2 for the gradient
            let colorArray = PARTICIPATED_GRADIENT.hsv(maxParticipations, false);
            logger.trace(`Rebuilding participatedColorArray with maxParticipations=${maxParticipations}, colorArray:`, colorArray);

            // Adjust the color gradient so there's more color variation in the low/middle range
            if (participatedTags.length > config.tooltips.minTagsForGradientAdjust) {
                try {
                    const highPctiles = config.tooltips.gradientAdjustPctiles.map(p => Math.floor(maxParticipations * p));
                    const middleColors = highPctiles.map(n => colorArray[n]).filter(Boolean);
                    colorArray = participatedGradient(middleColors).hsv(maxParticipations, false);
                } catch (err) {
                    logger.error(
                        `Failed to adjust gradient colorArray (maxParticipations=${maxParticipations}):`, err,
                        `\nparticipatedTags=`, participatedTags, `, `
                    );
                }
            }

            return colorArray;
        },
        [algorithm.userData.participatedHashtags, 55]
    );

    const findTooltip = (name: string): CheckboxTooltip | undefined => {
        if (filter.title == BooleanFilterName.HASHTAG) {
            if (name in algorithm.userData.followedTags) {
                return TOOLTIPS[TypeFilterName.FOLLOWED_HASHTAGS];
            } else if (trendingTagNames.has(name)) {
                return TOOLTIPS[TypeFilterName.TRENDING_HASHTAGS];
            } else if (name in algorithm.userData.participatedHashtags) {
                const tooltip = {...TOOLTIPS[TypeFilterName.PARTICIPATED_HASHTAGS]} as CheckboxTooltip;
                const numParticipations = algorithm.userData.participatedHashtags[name].numToots;
                const colorInstance = participatedColorArray[numParticipations - 1];

                if (colorInstance) {
                    tooltip.color = colorInstance.toHexString();
                } else {
                    logger.warn(`No color found for tag "${name}" w/ ${numParticipations} participations!`, participatedColorArray);
                }

                tooltip.text += ` ${numParticipations} times recently`;
                return tooltip;
            }
        } else if (filter.title == BooleanFilterName.USER && name in algorithm.userData.followedAccounts) {
            return TOOLTIPS[TypeFilterName.FOLLOWED_ACCOUNTS];
        } else if (filter.title == BooleanFilterName.LANGUAGE && name == algorithm.userData.preferredLanguage) {
            return TOOLTIPS[BooleanFilterName.LANGUAGE];
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
            (isTypeFilter || (filter.title == BooleanFilterName.USER)) ? algorithm.userData.followedAccounts : undefined,
            (filter.title == BooleanFilterName.LANGUAGE) ? algorithm.userData.preferredLanguage : undefined,
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


// Wrap middleColors in GRADIENT_ENDPOINTS and generate a gradient (see docs for details)
function participatedGradient(middleColors?: tinycolor.Instance[]): tinygradient.Instance {
    const gradientPoints = [GRADIENT_ENDPOINTS[0], ...(middleColors || []), GRADIENT_ENDPOINTS[1]];
    return tinygradient(...gradientPoints);
};
