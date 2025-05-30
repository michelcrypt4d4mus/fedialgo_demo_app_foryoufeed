/*
 * Component for collecting a list of options for a BooleanFilter and displaying
 * them as checkboxes, with a switchbar for invertSelection, sortByCount, etc.
 */
import { useState } from "react";

import { BooleanFilter } from "fedialgo";
import { Tooltip } from 'react-tooltip';

import FilterAccordionSection from "./FilterAccordionSection";
import FilterCheckboxGrid from "./filters/FilterCheckboxGrid";
import HeaderSwitch from "./filters/HeaderSwitch";
import Slider from "./Slider";
import { config, SwitchType } from "../../config";
import { tooltipZIndex } from "../../helpers/style_helpers";

interface BooleanFilterAccordionProps {
    filter: BooleanFilter,
};


export default function BooleanFilterAccordionSection(props: BooleanFilterAccordionProps) {
    const { filter } = props;

    const filterConfig = config.filters.boolean.optionsFormatting[filter.title];
    const showMinTootsSlider = Object.keys(filter.optionInfo).length > config.filters.boolean.minTootsSlider.minOptionsToShowSlider;
    const minTootsSliderTooltipAnchor = `${filter.title}-min-toots-slider-tooltip`;

    const [highlightedOnly, setHighlightedOnly] = useState(false);
    const [minToots, setMinToots] = useState(showMinTootsSlider ? config.filters.boolean.minTootsSlider.defaultValue : 0);
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
            onChange={(e) => setSortByValue(e.target.checked)}         // TODO: this will unnecessarily call TheAlgorithm.filterFeed(). not a huge problem but not ideal.
        />,
    ];

    // Add a highlights-only switch if configured
    if (filterConfig.highlights) {
        headerSwitches = headerSwitches.concat([
            <HeaderSwitch
                isChecked={highlightedOnly}
                key={SwitchType.HIGHLIGHTS_ONLY}
                label={SwitchType.HIGHLIGHTS_ONLY}
                onChange={(e) => setHighlightedOnly(e.target.checked)} // TODO: this will unnecessarily trigger TheAlgorithm.filterFeed(). not a huge problem but not ideal.
            />,
        ]);
    }

    // Add a slider and tooltip for minimum # of toots if there's enough options in the panel to justify it
    if (showMinTootsSlider) {
        headerSwitches = headerSwitches.concat([
            <Tooltip
                delayShow={config.filters.boolean.minTootsSlider.tooltipHoverDelay}
                id={minTootsSliderTooltipAnchor}
                key={'minTootsTooltipAnchor-slider'}
                place="bottom"
                style={{...tooltipZIndex, fontWeight: "normal", }}
            />,

            <div key={`${filter.title}-minTootsSlider`} style={{width: "23%"}}>
                <a
                    data-tooltip-id={minTootsSliderTooltipAnchor}
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
