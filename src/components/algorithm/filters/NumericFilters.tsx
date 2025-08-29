/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import { capitalCase } from "change-case";

import FilterAccordionSection from "../FilterAccordionSection";
import HeaderSwitch from "./HeaderSwitch";
import Slider from "./../Slider";
import { config } from "../../../config";
import { SwitchType } from "../../../helpers/style_helpers";
import { useAlgorithm } from "../../../hooks/useAlgorithm";


export default function NumericFilters(props: { isActive: boolean }) {
    const { isActive } = props;
    const { algorithm } = useAlgorithm();
    const numericFilters = Object.values(algorithm.filters.numericFilters);

    return (
        <FilterAccordionSection
            description={config.filters.numeric.description}
            isActive={isActive}
            switchbar={[
                <HeaderSwitch
                    isChecked={numericFilters.every((filter) => filter.invertSelection)}
                    key={SwitchType.INVERT_SELECTION + '--numericFilters'}
                    label={SwitchType.INVERT_SELECTION}
                    // TODO: this edits the filter object directly which isn't great
                    onChange={(e) => numericFilters.forEach((filter) => filter.invertSelection = e.target.checked)}
                    tooltipText={config.filters.numeric.invertSelectionTooltipTxt}
                />,
            ]}
            title={config.filters.numeric.title}
        >
            {Object.entries(algorithm.filters.numericFilters).map(([name, numericFilter], i) => (
                <Slider
                    description={numericFilter.description}
                    key={`${numericFilter.propertyName}_${i}`}
                    label={capitalCase(numericFilter.propertyName)}
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
    );
};
