/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, ReactElement, useMemo } from "react";
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import tinygradient from "tinygradient";
import { BooleanFilter, BooleanFilterName, TypeFilterName, percentileSegments, sortKeysByValue } from "fedialgo";

import FilterCheckbox from "./FilterCheckbox";
import { compareStr, debugMsg } from "../../helpers/string_helpers";
import { FOLLOWED_TAG_COLOR, FOLLOWED_USER_COLOR, PARTICIPATED_TAG_COLOR, PARTICIPATED_TAG_COLOR_MIN, TRENDING_TAG_COLOR_FADED } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

export type CheckboxTooltip = {
    color: CSSProperties["color"];
    text: string;
};

const MIN_PARTICIPATED_TAGS_FOR_GRADIENT_ADJUSTMENT = 40;
const GRADIENT_SEGMENTS = 10;

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
    const { filter, minToots, sortByCount, highlightedOnly } = props;
    const { algorithm } = useAlgorithm();

    const participatedColorArray = useMemo(() => {
        const participatedTags = Object.values(algorithm.userData.participatedHashtags);
        const maxParticipations = Math.max(...participatedTags.map(t => t.numToots), 2); // Ensure at least 2 for the gradient
        let participatedColorGradient = tinygradient(PARTICIPATED_TAG_COLOR_MIN, PARTICIPATED_TAG_COLOR);
        let colorArray = participatedColorGradient.rgb(maxParticipations);

        // Adjust the color gradient so there's more color variation in the low/middle range
        if (participatedTags.length > MIN_PARTICIPATED_TAGS_FOR_GRADIENT_ADJUSTMENT) {
            try {
                const segments = percentileSegments(participatedTags, t => t.numToots, GRADIENT_SEGMENTS);
                console.debug(`Made ${segments.length} segments for participated tags (maxParticipations=${maxParticipations    })`, segments);
                // const middleNumToots = [segments[segments.length - 3][0].numToots, segments[segments.length - 2][0].numToots];
                const middleNumToots = [segments[segments.length - 1][0].numToots];
                const highPercentiles = [Math.floor(maxParticipations * 0.95), Math.floor(maxParticipations * 0.98)];
                // const middleColors = middleNumToots.map(n => colorArray[n]).filter(Boolean);
                // const middleColors = [colorArray[ninetyPercentile]]; // Use the 90th percentile color
                const middleColors = highPercentiles.map(n => colorArray[n]).filter(Boolean);
                console.debug(`Adjusting participated tag color gradient for ${participatedTags.length} tags. middleNumToots:`, middleNumToots, `middleColors:`, middleColors);
                participatedColorGradient = tinygradient(PARTICIPATED_TAG_COLOR_MIN, ...middleColors, PARTICIPATED_TAG_COLOR);
                colorArray = participatedColorGradient.rgb(maxParticipations);
            } catch (err) {
                console.error(`Error adjusting participated tag color gradient:`, err);
            }
        }

        return colorArray;
    }, [algorithm.userData.participatedHashtags]);

    const trendingTagNames = useMemo(
        () => algorithm.trendingData.tags.map(tag => tag.name),
        [algorithm.trendingData.tags]
    );

    // Generate color and tooltip text for a hashtag checkbox
    const getTooltipInfo = (name: string): CheckboxTooltip | undefined => {
        if (filter.title == BooleanFilterName.HASHTAG) {
            if (name in algorithm.userData.followedTags) {
                return TOOLTIPS[TypeFilterName.FOLLOWED_HASHTAGS];
            } else if (trendingTagNames.includes(name)) {
                return TOOLTIPS[TypeFilterName.TRENDING_HASHTAGS];
            } else if (name in algorithm.userData.participatedHashtags) {
                const tooltip = {...TOOLTIPS[TypeFilterName.PARTICIPATED_HASHTAGS]};
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
    };

    const optionKeys: string[] = useMemo(
        () => {
            let optionInfo = filter.optionInfo;

            if (minToots) {
                // For "filtered" filters only allow options with a minimum number of toots (and active options)
                optionInfo = Object.fromEntries(Object.entries(filter.optionInfo).filter(
                    ([option, numToots]) => {
                        if (filter.validValues.includes(option)) return true;
                        if (numToots >= minToots) return (highlightedOnly ? !!getTooltipInfo(option) : true);
                        return false;
                    }
                ));
            }

            if (sortByCount) {
                return sortKeysByValue(optionInfo);
            } else {
                return Object.keys(optionInfo).sort((a, b) => compareStr(a, b));
            }
        },
        [
            algorithm.userData.followedTags,
            filter.optionInfo,
            filter.title,
            filter.validValues,
            highlightedOnly,
            minToots,
            sortByCount,
        ]
    );

    // Build a checkbox for a property filter. The 'name' is also the element of the filter array.
    const propertyCheckbox = (name: string, i: number) => {
        const tooltip = getTooltipInfo(name);

        return (
            <FilterCheckbox
                capitalize={filter.title == BooleanFilterName.TYPE}
                isChecked={filter.validValues.includes(name)}
                key={`${filter.title}_${name}_${i}`}
                label={name}
                labelExtra={filter.optionInfo[name]}
                onChange={(e) => filter.updateValidOptions(name, e.target.checked)}
                tooltip={tooltip}
                url={(filter.title == BooleanFilterName.HASHTAG) && algorithm.tagUrl(name)}
            />
        );
    };

    const gridify = (elements: ReactElement[]): ReactElement => {
        if (!elements || elements.length === 0) return <></>;
        const numCols = elements.length > 10 ? 3 : 2;

        const columns = elements.reduce((cols, element, i) => {
            const colIndex = i % numCols;
            cols[colIndex] ??= [];
            cols[colIndex].push(element);
            return cols;
        }, [] as ReactElement[][]);

        return (
            // Bootstrap Row/Col system margin and padding info: https://getbootstrap.com/docs/5.1/utilities/spacing/
            <Row>
                {columns.map((col, i) => <Col className="px-1" key={i}>{col}</Col>)}
            </Row>
        );
    };

    return gridify(optionKeys.map((option, i) => propertyCheckbox(option, i)));
};
