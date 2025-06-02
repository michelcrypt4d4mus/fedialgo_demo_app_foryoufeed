/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import Accordion from 'react-bootstrap/esm/Accordion';

import { capitalCase } from "change-case";

import BooleanFilterAccordionSection from "./BooleanFilterAccordionSection";
import FilterAccordionSection from "./FilterAccordionSection";
import HeaderSwitch from "./filters/HeaderSwitch";
import Slider from "./Slider";
import TopLevelAccordion from "../helpers/TopLevelAccordion";
import { getLogger } from '../../helpers/log_helpers';
import { config } from "../../config";
import { SwitchType } from "../../helpers/style_helpers";
import { HEADER_SWITCH_TOOLTIP } from "./filters/HeaderSwitch";
import { HIGHLIGHTED_TOOLTIP } from "./filters/FilterCheckbox";
import { noPadding } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

const logger = getLogger("FilterSetter");


export default function FilterSetter() {
    const { algorithm } = useAlgorithm();

    // Filter for 'visible' because the APP filters are currently hidden
    const booleanFilters = Object.values(algorithm.filters.booleanFilters).filter(f => f.visible);
    const numericFilters = Object.values(algorithm.filters.numericFilters);
    const hasActiveBooleanFilter = booleanFilters.some(f => f.validValues.length);
    const hasActiveNumericFilter = numericFilters.some(f => f.value > 0);
    const hasAnyActiveFilter = hasActiveNumericFilter || hasActiveBooleanFilter;

    // TODO: something in the numeric filter header switchbar is causing "unique key required" errors
    return (
        <TopLevelAccordion bodyStyle={noPadding} isActive={hasAnyActiveFilter} title="Feed Filters">
            {HEADER_SWITCH_TOOLTIP}
            {HIGHLIGHTED_TOOLTIP}

            <Accordion alwaysOpen>
                <FilterAccordionSection
                    description={config.filters.numeric.description}
                    isActive={hasActiveNumericFilter}
                    switchbar={[
                        <HeaderSwitch
                            isChecked={numericFilters.every((filter) => filter.invertSelection)}
                            key={SwitchType.INVERT_SELECTION + '--numericFilters'}
                            label={SwitchType.INVERT_SELECTION}
                            onChange={(e) => numericFilters.forEach((filter) => filter.invertSelection = e.target.checked)}
                            tooltipText={config.filters.numeric.invertSelectionTooltipTxt}
                        />,
                    ]}
                    title={config.filters.numeric.title}
                >
                    {Object.entries(algorithm.filters.numericFilters).map(([name, numericFilter], i) => (
                        <Slider
                            description={numericFilter.description}
                            key={`${numericFilter.title}_${i}`}
                            label={capitalCase(numericFilter.title)}
                            maxValue={config.filters.numeric.maxValue}
                            minValue={0}
                            // TODO: useCallback() could save a lot of re-renders here maybe...
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
