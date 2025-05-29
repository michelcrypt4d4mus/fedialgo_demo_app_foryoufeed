/*
 * Component for collecting a list of options for a BooleanFilter and displaying
 * them as checkboxes, with a switchbar for invertSelection, sortByCount, etc.
 */
import { useState } from "react";

import { BooleanFilter, BooleanFilterName, LANGUAGE_CODES } from "fedialgo";
import { capitalCase } from "change-case";
import { Tooltip } from 'react-tooltip';

import FilterAccordionSection from "./FilterAccordionSection";
import FilterCheckboxGrid from "./filters/FilterCheckboxGrid";
import HeaderSwitch, { SwitchType } from "./filters/HeaderSwitch";
import Slider from "./Slider";
import { TOOLTIP_ANCHOR, tooltipZIndex } from "../../helpers/style_helpers";

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
    const switchTooltipAnchor = `${TOOLTIP_ANCHOR}-${filter.title}`;
    const minTootsTooltipAnchor = `${switchTooltipAnchor}-min-toots`;

    const [highlightedOnly, setHighlightedOnly] = useState(false);
    const [minToots, setMinToots] = useState(hasMinToots ? DEFAULT_MIN_TOOTS_TO_APPEAR_IN_FILTER : 0);
    const [sortByCount, setSortByValue] = useState(false);

    let switchbar = [
        <HeaderSwitch
            isChecked={filter.invertSelection}
            label={SwitchType.INVERT_SELECTION}
            onChange={(e) => filter.invertSelection = e.target.checked} // TODO: this is modifying the filter directly
        />,
        <HeaderSwitch
            isChecked={sortByCount}
            label={SwitchType.SORT_BY_COUNT}
            onChange={(e) => setSortByValue(e.target.checked)} // TODO: this will unnecessarily call filterFeed
        />,
    ];

    if (filterConfig?.[SwitchType.HIGHLIGHTS_ONLY]) {
        switchbar = switchbar.concat([
            <HeaderSwitch
                isChecked={highlightedOnly}
                label={SwitchType.HIGHLIGHTS_ONLY}
                onChange={(e) => setHighlightedOnly(e.target.checked)} // TODO: this will unnecessarily call filterFeed
            />,
        ]);
    }

    if (hasMinToots) {
        switchbar = switchbar.concat([
            <div key="minTootsSlider" style={{width: "23%"}}>
                <a
                    data-tooltip-id={minTootsTooltipAnchor}
                    data-tooltip-content={`Hide ${filter.title}s with less than ${minToots} toots`}
                >
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
            <Tooltip delayShow={50} id={minTootsTooltipAnchor} place="bottom" style={tooltipZIndex}/>

            <FilterCheckboxGrid
                filter={filter}
                highlightedOnly={highlightedOnly}
                minToots={minToots}
                sortByCount={sortByCount}
            />
        </FilterAccordionSection>
    );
};
