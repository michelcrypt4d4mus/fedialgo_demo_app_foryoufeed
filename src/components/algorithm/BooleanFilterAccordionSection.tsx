/*
 * Component for collecting a list of options for a BooleanFilter and displaying
 * them as checkboxes, with a switchbar for invertSelection, sortByCount, etc.
 */
import React, { ChangeEvent, useState } from "react";

import { BooleanFilter, BooleanFilterName, LANGUAGE_CODES } from "fedialgo";
import { capitalCase } from "change-case";
import { Tooltip } from 'react-tooltip';

import FilterAccordionSection from "./FilterAccordionSection";
import FilterCheckbox from "./FilterCheckbox";
import FilterCheckboxGrid from "./FilterCheckboxGrid";
import Slider from "./Slider";
import { TOOLTIP_ANCHOR, tooltipZIndex } from "../../helpers/style_helpers";

export enum SwitchType {
    HIGHLIGHTS_ONLY = "highlightsOnly",
    INVERT_SELECTION = "invertSelection",
    SORT_BY_COUNT = "sortByCount",
};

export type FilterGridConfig = {
    labelMapper?: (name: string) => string;  // Fxn to transform the option name to a displayed label
    [SwitchType.HIGHLIGHTS_ONLY]?: boolean; // Whether to only show highlighted options
};

export const FILTER_CONFIG: {[key in BooleanFilterName]?: FilterGridConfig} = {
    [BooleanFilterName.HASHTAG]: {
        [SwitchType.HIGHLIGHTS_ONLY]: true,
    },
    [BooleanFilterName.LANGUAGE]: {
        labelMapper: (code: string) => LANGUAGE_CODES[code] ? capitalCase(LANGUAGE_CODES[code]) : code,
    },
    [BooleanFilterName.TYPE]: {
        labelMapper: (name: string) => capitalCase(name),
    },
    [BooleanFilterName.USER]: {
        [SwitchType.HIGHLIGHTS_ONLY]: true,
    },
};

const DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER = 5;
const MIN_OPTIONS_TO_SHOW_SLIDER = 30;

interface BooleanFilterAccordionProps {
    filter: BooleanFilter,
};


export default function BooleanFilterAccordionSection(props: BooleanFilterAccordionProps) {
    const { filter } = props;
    const filterConfig: FilterGridConfig | undefined = FILTER_CONFIG[filter.title];
    const hasMinToots = Object.keys(filter.optionInfo).length > MIN_OPTIONS_TO_SHOW_SLIDER;

    const [highlightedOnly, setHighlightedOnly] = useState(false);
    const [minToots, setMinToots] = useState(hasMinToots ? DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER : 0);
    const [sortByCount, setSortByValue] = useState(false);

    const minTootsTooltipTxt = `Hide ${filter.title}s with less than ${minToots} toots`;
    const minTootsTooltipAnchor = `${TOOLTIP_ANCHOR}-${filter.title}`;

    const makeHeaderSwitch = (
        label: SwitchType,
        isChecked: boolean,
        onChange: (e: ChangeEvent<HTMLInputElement>) => void
    ) => {
        return (
            <FilterCheckbox
                capitalize={true}
                isChecked={isChecked}
                key={label}
                label={label}
                onChange={onChange}
            />
        );
    };

    let switchbar = [
        makeHeaderSwitch(
            SwitchType.INVERT_SELECTION,
            filter.invertSelection,
            (e) => filter.invertSelection = e.target.checked // TODO: this is modifying the filter directly
        ),
        makeHeaderSwitch(
            SwitchType.SORT_BY_COUNT,
            sortByCount,
            (e) => setSortByValue(e.target.checked) // TODO: this will unnecessarily call filterFeed
        ),
    ];

    if (filterConfig?.[SwitchType.HIGHLIGHTS_ONLY]) {
        switchbar = switchbar.concat([
            makeHeaderSwitch(
                SwitchType.HIGHLIGHTS_ONLY,
                highlightedOnly,
                (e) => setHighlightedOnly(e.target.checked) // TODO: this will unnecessarily call filterFeed
            ),
        ]);
    }

    if (hasMinToots) {
        switchbar = switchbar.concat([
            <div style={{width: "23%"}} key={"minTootsSlider"}>
                <Tooltip id={minTootsTooltipAnchor} place="bottom" style={tooltipZIndex}/>

                <a data-tooltip-id={minTootsTooltipAnchor} data-tooltip-content={minTootsTooltipTxt}>
                    <Slider
                        hideValueBox={true}
                        label="Minimum"
                        minValue={1}
                        maxValue={Math.max(...Object.values(filter.optionInfo)) || 5}
                        onChange={async (e) => setMinToots(parseInt(e.target.value))}
                        stepSize={1}
                        value={minToots}
                        width={"80%"}
                    />
                </a>
            </div>
        ]);
    }

    return (
        <FilterAccordionSection
            description={filter.description}
            isActive={filter.validValues.length > 0}
            switchbar={switchbar}
            title={filter.title}
        >
            <FilterCheckboxGrid
                filter={filter}
                highlightedOnly={highlightedOnly}
                minToots={minToots}
                sortByCount={sortByCount}
            />
        </FilterAccordionSection>
    );
};
