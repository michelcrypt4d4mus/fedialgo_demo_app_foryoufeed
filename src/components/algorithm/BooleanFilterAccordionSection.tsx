/*
 * Component for collecting a list of options for a BooleanFilter and displaying
 * them as checkboxes, with a switchbar for invertSelection, sortByCount, etc.
 */
import { useMemo, useState } from "react";

import { BooleanFilter } from "fedialgo";

import FilterAccordionSection from "./FilterAccordionSection";
import FilterCheckboxGrid from "./filters/FilterCheckboxGrid";
import HeaderSwitch from "./filters/HeaderSwitch";
import MinTootsSlider, { computeDefaultValue } from "../helpers/MinTootsSlider";
import { config } from "../../config";
import { getLogger } from "../../helpers/log_helpers";
import { SwitchType } from "../../helpers/style_helpers";

interface BooleanFilterAccordionProps {
    filter: BooleanFilter,
};


export default function BooleanFilterAccordionSection(props: BooleanFilterAccordionProps) {
    const { filter } = props;
    const booleanFiltersConfig = config.filters.boolean;
    const logger = getLogger("BooleanFilterAccordionSection", filter.title);

    const minTootsSliderDefaultValue: number = useMemo(
        () => computeDefaultValue(filter.options, filter.title),
        [filter.options]
    );

    const minTootsState = useState<number>(minTootsSliderDefaultValue);
    const [highlightedOnly, setHighlightedOnly] = useState(false);
    const [sortByCount, setSortByValue] = useState(false);

    if (minTootsState[0] == 0 && minTootsSliderDefaultValue > 0) {
        logger.trace(`Updating minToots from default of 0 to ${minTootsSliderDefaultValue}`);
        minTootsState[1](minTootsSliderDefaultValue);
    }

    const headerSwitches = useMemo(
        () => {
            let _headerSwitches = [
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

            // Add a highlights-only switch if there are highlighted tooltips configured for this filter
            if (booleanFiltersConfig.optionsFormatting[filter.title]?.tooltips) {
                _headerSwitches = _headerSwitches.concat([
                    <HeaderSwitch
                        isChecked={highlightedOnly}
                        key={SwitchType.HIGHLIGHTS_ONLY}
                        label={SwitchType.HIGHLIGHTS_ONLY}
                        onChange={(e) => setHighlightedOnly(e.target.checked)} // TODO: this will unnecessarily trigger TheAlgorithm.filterFeed(). not a huge problem but not ideal.
                    />,
                ]);
            }

            // Add a slider and tooltip for minimum # of toots if there's enough options in the panel to justify it
            if (minTootsSliderDefaultValue > 0) {
                _headerSwitches = _headerSwitches.concat(
                    <MinTootsSlider
                        key={`${filter.title}-minTootsSlider`}
                        minTootsState={minTootsState}
                        panelTitle={filter.title}
                        objList={filter.options}
                    />
                );
            }

            return _headerSwitches;
        },
        [
            filter,
            filter.invertSelection,
            filter.options,
            highlightedOnly,
            minTootsSliderDefaultValue,
            minTootsState[0],
            sortByCount
        ]
    );

    return (
        <FilterAccordionSection
            description={filter.description}
            isActive={filter.selectedOptions.length > 0}
            switchbar={headerSwitches}
            title={filter.title}
        >
            <FilterCheckboxGrid
                filter={filter}
                highlightedOnly={highlightedOnly}
                minToots={minTootsState[0]}
                sortByCount={sortByCount}
            />
        </FilterAccordionSection>
    );
};
