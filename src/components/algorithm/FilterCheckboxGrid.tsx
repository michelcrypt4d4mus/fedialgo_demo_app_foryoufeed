/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, useMemo } from "react";

import Col from 'react-bootstrap/Col';
import FilterCheckbox from "./FilterCheckbox";
import Row from 'react-bootstrap/Row';
import { BooleanFilterName, TypeFilterName, sortKeysByValue } from "fedialgo";

import { compareStr, debugMsg } from "../../helpers/string_helpers";
import { FOLLOWED_TAG_COLOR, FOLLOWED_USER_COLOR, PARTICIPATED_TAG_COLOR_FADED, TRENDING_TAG_COLOR_FADED } from "../../helpers/style_helpers";
import { useAlgorithm, BooleanFilter } from "../../hooks/useAlgorithm";

type HashtagTooltip = {
    color?: CSSProperties["color"];
    text: string;
};

// Filtered filters are those that require a minimum number of toots to appear as filter options
export const FILTERED_FILTERS = [
    BooleanFilterName.HASHTAG,
    BooleanFilterName.USER,
];

const TOOLTIPS: {[key in (TypeFilterName | BooleanFilterName)]?: HashtagTooltip} = {
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
        color: PARTICIPATED_TAG_COLOR_FADED,
        text: `You've posted this hashtag`, // number of times is added when used
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
    sortByValue?: boolean,
};


export default function FilterCheckboxGrid(props: FilterCheckboxGridProps) {
    const { filter, minToots, sortByValue, highlightedOnly } = props;
    const { algorithm } = useAlgorithm();

    const trendingTagNames = algorithm.trendingData.tags.map(tag => tag.name);
    let optionKeys: string[];

    // Generate color and tooltip text for a hashtag checkbox
    const getTooltipInfo = (name: string): HashtagTooltip | undefined => {
        if (filter.title == BooleanFilterName.HASHTAG) {
            if (name in algorithm.userData.followedTags) {
                return TOOLTIPS[TypeFilterName.FOLLOWED_HASHTAGS];
            } else if (trendingTagNames.includes(name)) {
                return TOOLTIPS[TypeFilterName.TRENDING_HASHTAGS];
            } else if (name in algorithm.userData.participatedHashtags) {
                const tooltip = {...TOOLTIPS[TypeFilterName.PARTICIPATED_HASHTAGS]};
                tooltip.text += ` ${algorithm.userData.participatedHashtags[name].numToots} times recently`;
                return tooltip;
            }
        } else if (filter.title == BooleanFilterName.USER && name in algorithm.userData.followedAccounts) {
            return TOOLTIPS[TypeFilterName.FOLLOWED_ACCOUNTS];
        } else if (filter.title == BooleanFilterName.LANGUAGE && name == algorithm.userData.preferredLanguage) {
            return TOOLTIPS[BooleanFilterName.LANGUAGE];
        }
    };

    const optionInfo = useMemo(
        () => {
            // debugMsg(`useMemo() recomputing optionInfo for ${filter.title}, validValues:`, filter.validValues);
            if (!FILTERED_FILTERS.includes(filter.title)) return filter.optionInfo;

            // For "filtered" filters only allow options with a minimum number of toots (and active options)
            return Object.fromEntries(Object.entries(filter.optionInfo).filter(
                ([option, numToots]) => {
                    if (filter.validValues.includes(option)) return true;
                    if (numToots >= minToots) return (highlightedOnly ? !!getTooltipInfo(option) : true);
                    return false;
                }
            ));
        },
        [
            algorithm.userData.followedTags,
            filter.optionInfo,
            filter.title,
            filter.validValues,
            minToots,
            highlightedOnly
        ]
    );

    if (sortByValue) {
        optionKeys = sortKeysByValue(optionInfo)
    } else {
        optionKeys = Object.keys(optionInfo).sort((a, b) => compareStr(a, b));
    }

    // Build a checkbox for a property filter. The 'name' is also the element of the filter array.
    const propertyCheckbox = (name: string) => {
        const tooltip = getTooltipInfo(name);

        return (
            <FilterCheckbox
                capitalize={filter.title == BooleanFilterName.TYPE}
                isChecked={filter.validValues.includes(name)}
                key={name}
                label={name}
                labelExtra={filter.optionInfo[name]}
                onChange={(e) => filter.updateValidOptions(name, e.target.checked)}
                tooltipColor={tooltip?.color}
                tooltipText={tooltip?.text && `${tooltip.text}.`}
                url={(filter.title == BooleanFilterName.HASHTAG) && algorithm.tagUrl(name)}
            />
        );
    };

    const gridify = (elements: React.ReactElement[]): React.ReactElement => {
        if (!elements || elements.length === 0) return <></>;
        const numCols = elements.length > 10 ? 3 : 2;

        const columns = elements.reduce((cols, element, i) => {
            const colIndex = i % numCols;
            cols[colIndex] ??= [];
            cols[colIndex].push(element);
            return cols;
        }, [] as React.ReactElement[][]);

        return (
            // Bootstrap Row/Col system margin and padding info: https://getbootstrap.com/docs/5.1/utilities/spacing/
            <Row>
                {columns.map((col, i: number) => <Col className="px-1" key={i}>{col}</Col>)}
            </Row>
        );
    };

    return gridify(optionKeys.map((option) => propertyCheckbox(option)));
};
