/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import Accordion from 'react-bootstrap/esm/Accordion';

import { capitalCase } from "change-case";
import { Tooltip } from 'react-tooltip';

import BooleanFilterAccordionSection from "./BooleanFilterAccordionSection";
import FilterAccordionSection from "./FilterAccordionSection";
import HeaderSwitch, { SwitchType } from "./filters/HeaderSwitch";
import Slider from "./Slider";
import TopLevelAccordion from "../helpers/TopLevelAccordion";
import { HEADER_SWITCH_TOOLTIP } from "./filters/HeaderSwitch";
import { HIGHLIGHTED_TOOLTIP } from "./filters/FilterCheckbox";
import { noPadding, tooltipZIndex } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";


export default function FilterSetter() {
    const { algorithm } = useAlgorithm();

    // Filter for 'visible' because the APP filters are currently hidden
    const booleanFilters = Object.values(algorithm.filters.booleanFilters).filter(f => f.visible);
    const numericFilters = Object.values(algorithm.filters.numericFilters);
    const hasActiveBooleanFilter = booleanFilters.some(f => f.validValues.length);
    const hasActiveNumericFilter = numericFilters.some(f => f.value > 0);
    const hasAnyActiveFilter = hasActiveNumericFilter || hasActiveBooleanFilter;

    const numericFilterSwitchbar = [
        <HeaderSwitch
            isChecked={numericFilters.every((filter) => filter.invertSelection)}
            key={SwitchType.INVERT_SELECTION + 'numericFilters'}
            label={SwitchType.INVERT_SELECTION}
            onChange={(e) => numericFilters.forEach((filter) => filter.invertSelection = e.target.checked)}
            tooltipText="Show toots with less than the selected number of interactions"
        />,
    ];

    // TODO: something in the numeric filter header switchbar is causing "unique key required" errors
    return (
        <TopLevelAccordion bodyStyle={noPadding} isActive={hasAnyActiveFilter} title="Feed Filters">
            {HEADER_SWITCH_TOOLTIP}
            {HIGHLIGHTED_TOOLTIP}

            <Accordion alwaysOpen>
                <FilterAccordionSection
                    description={"Filter based on minimum/maximum number of replies, retoots, etc"}
                    isActive={hasActiveNumericFilter}
                    switchbar={numericFilterSwitchbar}
                    title="Interactions"
                >
                    {Object.entries(algorithm.filters.numericFilters).map(([name, numericFilter], i) => (
                        <Slider
                            description={numericFilter.description}
                            key={`${numericFilter.title}_${i}`}
                            label={capitalCase(numericFilter.title)}
                            maxValue={50}
                            minValue={0}
                            onChange={async (e) => {
                                numericFilter.value = Number(e.target.value);
                                algorithm.updateFilters(algorithm.filters);
                            }}
                            stepSize={1}
                            value={numericFilter.value}
                        />
                    ))}
                </FilterAccordionSection>

                {booleanFilters.map((f) => <BooleanFilterAccordionSection filter={f} key={f.title} />)}
            </Accordion>
        </TopLevelAccordion>
    );
};
