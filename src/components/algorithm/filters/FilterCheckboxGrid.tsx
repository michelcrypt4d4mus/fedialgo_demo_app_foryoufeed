/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import { useMemo } from "react";

import tinycolor from "tinycolor2";
import tinygradient from "tinygradient";
import { BooleanFilter, BooleanFilterName, TypeFilterName, sortKeysByValue } from "fedialgo";

import FilterCheckbox from "./FilterCheckbox";
import { alphabetize } from "../../../helpers/string_helpers";
import { ComponentLogger } from "../../../helpers/log_helpers";
import { config, CheckboxTooltip, FilterGridConfig } from "../../../config";
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

    const logger = useMemo(() => new ComponentLogger("FilterCheckboxGrid", filter.title), [filter.title]);
    const filterConfig: FilterGridConfig | undefined = config.filters.boolean.optionsList[filter.title];
    let findTooltip: (name: string) => CheckboxTooltip;  // Just initializing here at the top, is defined later

    const trendingTagNames = useMemo(
        () => new Set(algorithm.trendingData.tags.map(tag => tag.name)),
        [algorithm.trendingData.tags]
    );

    const participatedColorArray = useMemo(
        () => {
            // Only hashtags use the gradient. Return same EMPTY_GRADIENT object to avoid triggering re-rendering.
            if (filter.title != BooleanFilterName.HASHTAG) return EMPTY_GRADIENT;

            logger.trace(`Rebuilding participatedColorArray...`);
            const participatedTags = Object.values(algorithm.userData.participatedHashtags);
            const maxParticipations = Math.max(...participatedTags.map(t => t.numToots), 2);  // Ensure at least 2 for the gradient
            let colorArray = PARTICIPATED_GRADIENT.hsv(maxParticipations, false);

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
        [algorithm.userData.participatedHashtags]
    );

    // Different filters have different tooltip logic so we need to set up a real findTooltip function
    if (filter.title == BooleanFilterName.HASHTAG) {
        findTooltip = (name: string): CheckboxTooltip | undefined => {
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
                    logger.error(`No color found for tag "${name}" w/ ${numParticipations} participations!`, participatedColorArray);
                }

                tooltip.text += ` ${numParticipations} times recently`;
                return tooltip;
            }
        }
    } else if (filter.title == BooleanFilterName.USER) {
        findTooltip = (name: string) => {
            return algorithm.userData.followedAccounts[name] && TOOLTIPS[TypeFilterName.FOLLOWED_ACCOUNTS];
        }
    } else if (filter.title == BooleanFilterName.LANGUAGE) {
        findTooltip = (name: string) => {
            return (name == algorithm.userData.preferredLanguage) && TOOLTIPS[BooleanFilterName.LANGUAGE];
        }
    } else {
        findTooltip = (name: string) => undefined;
    }

    // Build a checkbox for a property filter. The 'name' is also the element of the filter array.
    const propertyCheckbox = (name: string, i: number) => {
        return (
            <FilterCheckbox
                isChecked={filter.isOptionEnabled(name)}
                key={`${filter.title}_${name}_${i}`}
                label={filterConfig?.labelMapper ? filterConfig?.labelMapper(name) : name}
                labelExtra={filter.optionInfo[name]}
                onChange={(e) => filter.updateValidOptions(name, e.target.checked)}
                tooltip={findTooltip(name)}
                url={(filter.title == BooleanFilterName.HASHTAG) && algorithm.tagUrl(name)}
            />
        );
    };

    const optionGrid = useMemo(
        () => {
            let optionInfo = {...filter.optionInfo};
            logger.trace(`Rebuilding optionGrid for ${Object.keys(optionInfo).length} options...`);

            // For filters w/many options only show choices with a min # of toots + already selected options
            if (minToots) {
                optionInfo = Object.fromEntries(
                    Object.entries(optionInfo).filter(
                        ([optionName, numToots]) => {
                            if (filter.isOptionEnabled(optionName)) return true;  // Always show selected options

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
            algorithm.userData.followedAccounts,
            algorithm.userData.followedTags,
            algorithm.userData.participatedHashtags,
            algorithm.userData.preferredLanguage,
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
