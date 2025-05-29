/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import { CSSProperties, useCallback, useMemo } from "react";

import tinygradient from "tinygradient";
import { BooleanFilter, BooleanFilterName, TypeFilterName, sortKeysByValue } from "fedialgo";

import FilterCheckbox from "./FilterCheckbox";
import { ComponentLogger } from "../../../helpers/log_helpers";
import { compareStr } from "../../../helpers/string_helpers";
import { FILTER_CONFIG, FilterGridConfig } from "../BooleanFilterAccordionSection";
import { FOLLOWED_TAG_COLOR, FOLLOWED_USER_COLOR, PARTICIPATED_TAG_COLOR, PARTICIPATED_TAG_COLOR_MIN, TRENDING_TAG_COLOR_FADED } from "../../../helpers/style_helpers";
import { gridify } from '../../../helpers/react_helpers';
import { useAlgorithm } from "../../../hooks/useAlgorithm";

export type CheckboxTooltip = {
    color: CSSProperties["color"];
    text: string;
};

// Percentiles to use for adjusting the participated tag color gradient
const GRADIENT_ADJUST_PCTILES = [0.95, 0.98];
const MIN_PARTICIPATED_TAGS_FOR_GRADIENT_ADJUSTMENT = 40;

const TOOLTIPS: {[key in (TypeFilterName | BooleanFilterName)]?: CheckboxTooltip} = {
    [BooleanFilterName.LANGUAGE]: {
        color: FOLLOWED_USER_COLOR,
        text: `You post most in this language`,
    },
    [TypeFilterName.FOLLOWED_ACCOUNTS]: {
        color: FOLLOWED_USER_COLOR,
        text: `You follow this account`,
    },
    [TypeFilterName.FOLLOWED_HASHTAGS]: {
        color: FOLLOWED_TAG_COLOR,
        text: `You follow this hashtag`,
    },
    [TypeFilterName.PARTICIPATED_HASHTAGS]: {
        color: PARTICIPATED_TAG_COLOR,
        text: `You've posted this hashtag`, // the string "N times" is appended in getTooltipInfo()
    },
    [TypeFilterName.TRENDING_HASHTAGS]: {
        color: TRENDING_TAG_COLOR_FADED,
        text: `This hashtag is trending`,
    },
};

interface FilterCheckboxGridProps {
    filter: BooleanFilter,
    highlightedOnly?: boolean,
    minToots?: number,
    sortByCount?: boolean,
};


export default function FilterCheckboxGrid(props: FilterCheckboxGridProps) {
    const { filter, highlightedOnly, minToots, sortByCount } = props;
    const { algorithm } = useAlgorithm();

    const filterConfig: FilterGridConfig | undefined = FILTER_CONFIG[filter.title];
    const logger = useMemo(() => new ComponentLogger("FilterCheckboxGrid", filter.title), [filter.title]);

    const participatedColorArray = useMemo(
        () => {
            logger.trace(`Rebuilding participatedColorArray...`);
            const participatedTags = Object.values(algorithm.userData.participatedHashtags);
            const maxParticipations = Math.max(...participatedTags.map(t => t.numToots), 2); // Ensure at least 2 for the gradient
            let participatedColorGradient = tinygradient(PARTICIPATED_TAG_COLOR_MIN, PARTICIPATED_TAG_COLOR);
            let colorArray = participatedColorGradient.hsv(maxParticipations, false);

            // Adjust the color gradient so there's more color variation in the low/middle range
            if (participatedTags.length > MIN_PARTICIPATED_TAGS_FOR_GRADIENT_ADJUSTMENT) {
                try {
                    const highPercentiles = GRADIENT_ADJUST_PCTILES.map(p => Math.floor(maxParticipations * p));
                    const middleColors = highPercentiles.map(n => colorArray[n]).filter(Boolean);
                    participatedColorGradient = tinygradient(PARTICIPATED_TAG_COLOR_MIN, ...middleColors, PARTICIPATED_TAG_COLOR);
                    colorArray = participatedColorGradient.hsv(maxParticipations, false);
                } catch (err) {
                    logger.warn(
                        `Error adjusting participatedTagColorGradient (maxParticipations=${maxParticipations}):`, err,
                        `\nparticipatedTags=`, participatedTags, `, `
                    );
                }
            }

            return colorArray;
        },
        [algorithm.userData.participatedHashtags]
    );

    const trendingTagNames = useMemo(
        () => algorithm.trendingData.tags.map(tag => tag.name),
        [algorithm.trendingData.tags]
    );

    // Generate color and tooltip text for a hashtag checkbox
    const getTooltipInfo = useCallback(
        (name: string): CheckboxTooltip | undefined => {
            if (filter.title == BooleanFilterName.HASHTAG) {
                if (name in algorithm.userData.followedTags) {
                    return TOOLTIPS[TypeFilterName.FOLLOWED_HASHTAGS];
                } else if (trendingTagNames.includes(name)) {
                    return TOOLTIPS[TypeFilterName.TRENDING_HASHTAGS];
                } else if (name in algorithm.userData.participatedHashtags) {
                    const tooltip = {...TOOLTIPS[TypeFilterName.PARTICIPATED_HASHTAGS]} as CheckboxTooltip;
                    const numParticipations = algorithm.userData.participatedHashtags[name].numToots;
                    tooltip.text += ` ${numParticipations} times recently`;
                    tooltip.color = participatedColorArray[numParticipations - 1].toHexString();
                    return tooltip;
                }
            } else if (filter.title == BooleanFilterName.USER && name in algorithm.userData.followedAccounts) {
                return TOOLTIPS[TypeFilterName.FOLLOWED_ACCOUNTS];
            } else if (filter.title == BooleanFilterName.LANGUAGE && name == algorithm.userData.preferredLanguage) {
                return TOOLTIPS[BooleanFilterName.LANGUAGE];
            }
        },
        [
            algorithm.userData.followedAccounts,
            algorithm.userData.followedTags,
            algorithm.userData.participatedHashtags,
            algorithm.userData.preferredLanguage,
            filter.title,
            participatedColorArray,
            trendingTagNames,
        ]
    );

    // Build a checkbox for a property filter. The 'name' is also the element of the filter array.
    const propertyCheckbox = useCallback(
        (name: string, i: number) => {
            return (
                <FilterCheckbox
                    isChecked={filter.validValues.includes(name)}
                    key={`${filter.title}_${name}_${i}`}
                    label={filterConfig?.labelMapper ? filterConfig?.labelMapper(name) : name}
                    labelExtra={filter.optionInfo[name]}
                    onChange={(e) => filter.updateValidOptions(name, e.target.checked)}
                    tooltip={getTooltipInfo(name)}
                    url={(filter.title == BooleanFilterName.HASHTAG) && algorithm.tagUrl(name)}
                />
            );
        },
        [
            algorithm.tagUrl,   // This shouldn't change return value even if algorithm changes; here just to be safe
            filter.optionInfo,  // changes to optionInfo cause fedialgo to create a new object so this triggers
            filter.title,
            filter.validValues, // changes to optionInfo cause fedialgo to create a new object so this triggers
            getTooltipInfo,
        ]
    );

    const optionGrid = useMemo(
        () => {
            logger.trace(`Rebuilding optionGrid...`);
            let optionInfo = filter.optionInfo;
            let optionKeys: string[];

            // For filters w/many options only show choices with a min # of toots + already selected options
            if (minToots) {
                optionInfo = Object.fromEntries(Object.entries(filter.optionInfo).filter(
                    ([option, numToots]) => {
                        if (filter.validValues.includes(option)) return true;

                        if (numToots >= minToots) {
                            return (highlightedOnly ? !!getTooltipInfo(option) : true);
                        } else {
                            return false;
                        }
                    }
                ));
            }

            if (sortByCount) {
                optionKeys = sortKeysByValue(optionInfo);
            } else {
                optionKeys = Object.keys(optionInfo).sort((a, b) => compareStr(a, b));
            }

            return gridify(optionKeys.map((option, i) => propertyCheckbox(option, i)));
        },
        [
            filter.optionInfo,
            filter.title,
            filter.validValues,
            getTooltipInfo,
            highlightedOnly,
            minToots,
            propertyCheckbox,
            sortByCount,
        ]
    );

    return optionGrid;
};
