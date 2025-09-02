/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties } from "react";
import Accordion from "react-bootstrap/esm/Accordion";

import BooleanFilterAccordionSection from "./BooleanFilterAccordionSection";
import NumericFilters from "./filters/NumericFilters";
import TopLevelAccordion from "../helpers/TopLevelAccordion";
import { config } from "../../config";
import { HEADER_SWITCH_TOOLTIP } from "./filters/HeaderSwitch";
import { HIGHLIGHTED_TOOLTIP } from "./filters/FilterCheckbox";
import { noPadding, stickySwitchContainer } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";


export default function FeedFiltersAccordionSection() {
    const { algorithm, allowMultiSelectCheckbox, showFilterHighlightsCheckbox } = useAlgorithm();

    const booleanFiltersCfg = config.filters.boolean.optionsFormatting;
    // Filter for 'visible' because the APP filters are currently hidden
    const booleanFilters = Object.values(algorithm.filters.booleanFilters).filter(f => !booleanFiltersCfg[f.propertyName].hidden);
    const numericFilters = Object.values(algorithm.filters.numericFilters);
    const hasActiveBooleanFilter = booleanFilters.some(f => f.selectedOptions.length);
    const hasActiveNumericFilter = numericFilters.some(f => f.value > 0);
    const hasAnyActiveFilter = hasActiveNumericFilter || hasActiveBooleanFilter;

    // Sort the filter sections based on configured 'position' value
    const filterPositions = booleanFilters.reduce(
        (filters, f) => {
            const position = booleanFiltersCfg[f.propertyName].position;
            filters[position] = <BooleanFilterAccordionSection filter={f} key={f.propertyName}/>
            return filters;
        },
        {[config.filters.numeric.position]: <NumericFilters isActive={hasActiveNumericFilter} key={"numeric"} />}
    );

    return (
        <TopLevelAccordion bodyStyle={noPadding} isActive={hasAnyActiveFilter} title="Feed Filters">
            {HEADER_SWITCH_TOOLTIP}
            {HIGHLIGHTED_TOOLTIP}

            <Accordion alwaysOpen>
                <div style={filterSwitchContainer}>
                    {allowMultiSelectCheckbox}
                    {showFilterHighlightsCheckbox}
                </div>

                {Object.keys(filterPositions).sort().map((position) => filterPositions[position])}
            </Accordion>
        </TopLevelAccordion>
    );
};


const filterSwitchContainer: CSSProperties = {
    ...stickySwitchContainer,
    fontSize: 16,
    fontWeight: "bold",
    justifyContent: "space-around",
    paddingTop: "3px",
};
