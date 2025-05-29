/*
 * Component for collecting a list of options for a BooleanFilter and displaying
 * them as checkboxes, with a switchbar for invertSelection, sortByCount, etc.
 */
import { useMemo, useState } from "react";

import { BooleanFilter, BooleanFilterName, LANGUAGE_CODES } from "fedialgo";
import { capitalCase } from "change-case";
import { Tooltip } from 'react-tooltip';

import FilterAccordionSection from "./FilterAccordionSection";
import FilterCheckboxGrid from "./filters/FilterCheckboxGrid";
import HeaderSwitch from "./filters/HeaderSwitch";
import Slider from "./Slider";
import { config, SwitchType } from "../../config";
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

interface BooleanFilterAccordionProps {
    filter: BooleanFilter,
};


export default function BooleanFilterAccordionSection(props: BooleanFilterAccordionProps) {
    const { filter } = props;

    const showMinTootsSlider = Object.keys(filter.optionInfo).length > config.filters.minOptionsToShowSlider;
    const minTootsTooltipAnchor = `${TOOLTIP_ANCHOR}-${filter.title}-min-toots`;
    const filterConfig: FilterGridConfig | undefined = FILTER_CONFIG[filter.title];

    const [highlightedOnly, setHighlightedOnly] = useState(false);
    const [minToots, setMinToots] = useState(showMinTootsSlider ? config.filters.defaultMinTootsToAppear : 0);
    const [sortByCount, setSortByValue] = useState(false);

    let headerSwitches = [
        <HeaderSwitch
            isChecked={filter.invertSelection}
            key={SwitchType.INVERT_SELECTION}
            label={SwitchType.INVERT_SELECTION}
            onChange={(e) => filter.invertSelection = e.target.checked} // TODO: this is modifying the filter directly
        />,
        <HeaderSwitch
            isChecked={sortByCount}
            key={SwitchType.SORT_BY_COUNT}
            label={SwitchType.SORT_BY_COUNT}
            onChange={(e) => setSortByValue(e.target.checked)} // TODO: this will unnecessarily call filterFeed
        />,
    ];

    // Add a highlights-only switch if configured
    if (filterConfig?.[SwitchType.HIGHLIGHTS_ONLY]) {
        headerSwitches = headerSwitches.concat([
            <HeaderSwitch
                isChecked={highlightedOnly}
                key={SwitchType.HIGHLIGHTS_ONLY}
                label={SwitchType.HIGHLIGHTS_ONLY}
                onChange={(e) => setHighlightedOnly(e.target.checked)} // TODO: this will unnecessarily call filterFeed
            />,
        ]);
    }

    // Add a slider for minimum # of toots if there's enough options in the panel to justify it
    if (showMinTootsSlider) {
        headerSwitches = headerSwitches.concat([
            <div key={`${filter.title}-minTootsSlider`} style={{width: "23%"}}>
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
            </div>,

            // Tooltip for the minToots slider
            <Tooltip
                delayShow={config.tooltips.minTootsSliderDelay}
                id={minTootsTooltipAnchor}
                place="bottom"
                style={{...tooltipZIndex, fontWeight: "normal", }}
            />,
        ]);
    }

    return (
        <FilterAccordionSection
            description={filter.description}
            isActive={filter.validValues.length > 0}
            switchbar={headerSwitches}
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
