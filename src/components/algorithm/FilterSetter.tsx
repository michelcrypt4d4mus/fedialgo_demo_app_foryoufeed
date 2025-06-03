/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import Accordion from 'react-bootstrap/esm/Accordion';

import BooleanFilterAccordionSection from "./BooleanFilterAccordionSection";
import NumericFilters from "./filters/NumericFilters";
import TopLevelAccordion from "../helpers/TopLevelAccordion";
import { getLogger } from '../../helpers/log_helpers';
import { config } from "../../config";
import { HEADER_SWITCH_TOOLTIP } from "./filters/HeaderSwitch";
import { HIGHLIGHTED_TOOLTIP } from "./filters/FilterCheckbox";
import { noPadding } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

const logger = getLogger("FilterSetter");


export default function FilterSetter() {
    const { algorithm } = useAlgorithm();

    const booleanFiltersCfg = config.filters.boolean.optionsFormatting;
    // Filter for 'visible' because the APP filters are currently hidden
    const booleanFilters = Object.values(algorithm.filters.booleanFilters).filter(f => !booleanFiltersCfg[f.title].hidden);
    const numericFilters = Object.values(algorithm.filters.numericFilters);
    const hasActiveBooleanFilter = booleanFilters.some(f => f.selectedOptions.length);
    const hasActiveNumericFilter = numericFilters.some(f => f.value > 0);
    const hasAnyActiveFilter = hasActiveNumericFilter || hasActiveBooleanFilter;

    const filterPositions = booleanFilters.reduce(
        (filters, f) => {
            const position = booleanFiltersCfg[f.title].position;
            filters[position] = <BooleanFilterAccordionSection filter={f} key={f.title} />;
            return filters;
        },
        {[config.filters.numeric.position]: <NumericFilters isActive={hasActiveNumericFilter} key={"numeric"} />}
    );

    return (
        <TopLevelAccordion bodyStyle={noPadding} isActive={hasAnyActiveFilter} title="Feed Filters">
            {HEADER_SWITCH_TOOLTIP}
            {HIGHLIGHTED_TOOLTIP}

            <Accordion alwaysOpen>
                {Object.keys(filterPositions).sort().map((position) => filterPositions[position])}
            </Accordion>
        </TopLevelAccordion>
    );
};
