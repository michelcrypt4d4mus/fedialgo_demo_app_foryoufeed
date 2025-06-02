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
import NumericFilters from "./filters/NumericFilters";
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
                <NumericFilters isActive={hasActiveNumericFilter} />
                {booleanFilters.map((f) => <BooleanFilterAccordionSection filter={f} key={f.title} />)}
            </Accordion>
        </TopLevelAccordion>
    );
};
