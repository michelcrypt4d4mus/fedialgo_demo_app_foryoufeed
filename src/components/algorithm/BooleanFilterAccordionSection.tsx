/*
 * Component for collecting a list of options for a BooleanFilter and displaying
 * them as checkboxes, with a switchbar for invertSelection, sortByCount, etc.
 */
import React, { useState } from "react";

import { BooleanFilter } from "fedialgo";
import { Tooltip } from 'react-tooltip';

import FilterAccordionSection from "./FilterAccordionSection";
import FilterCheckbox from "./FilterCheckbox";
import FilterCheckboxGrid from "./FilterCheckboxGrid";
import Slider from "./Slider";
import { TOOLTIP_ANCHOR } from "../../helpers/style_helpers";

export enum SwitchType {
    HIGHLIGHTS_ONLY = "highlightsOnly",
    INVERT_SELECTION = "invertSelection",
    SORT_BY_COUNT = "sortByCount",
};

const DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER = 5;
const MIN_OPTIONS_TO_APPEAR_IN_FILTER = 30;

interface BooleanFilterAccordionProps {
    filter: BooleanFilter,
};


export default function BooleanFilterAccordionSection(props: BooleanFilterAccordionProps) {
    const { filter } = props;
    const hasMinToots = Object.keys(filter.optionInfo).length > MIN_OPTIONS_TO_APPEAR_IN_FILTER;

    const [highlightedOnly, setHighlightedOnly] = useState(false);
    const [minToots, setMinToots] = useState(hasMinToots ? DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER : 0);
    const [sortByCount, setSortByValue] = useState(false);

    const minTootsTooltipTxt = `Hide ${filter.title}s with less than ${minToots} toots`;
    const minTootsTooltipAnchor = `${TOOLTIP_ANCHOR}-${filter.title}`;
    const makeSpacer = (key: string) => <div key={key} style={{width: "20px"}} />;

    const makeSwitch = (label: string, isChecked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
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
        makeSwitch(
            SwitchType.INVERT_SELECTION,
            filter.invertSelection,
            (e) => filter.invertSelection = e.target.checked // TODO: this is modifying the filter directly
        ),
        makeSwitch(
            SwitchType.SORT_BY_COUNT,
            sortByCount,
            (e) => setSortByValue(e.target.checked) // TODO: this will unnecessarily call filterFeed
        ),
    ];

    if (!hasMinToots) {
        switchbar = [makeSpacer("spacer1"), ...switchbar, makeSpacer("spacer2")];
    } else {
        switchbar = switchbar.concat([
            makeSwitch(
                SwitchType.HIGHLIGHTS_ONLY,
                highlightedOnly,
                (e) => setHighlightedOnly(e.target.checked) // TODO: this will unnecessarily call filterFeed
            ),

            <div style={{width: "23%"}} key={"minTootsSlider"}>
                <Tooltip id={minTootsTooltipAnchor} place="bottom" />

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
