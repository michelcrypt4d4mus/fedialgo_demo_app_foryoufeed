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
import { useLocalStorage2 } from "../../hooks/useLocalStorage";

export type HeaderSwitchState = {
    readonly [SwitchType.HIGHLIGHTS_ONLY]?: boolean;
    readonly [SwitchType.SORT_BY_COUNT]?: boolean;
};

const DEFAULT_SWITCH_STATE: HeaderSwitchState = {
    [SwitchType.HIGHLIGHTS_ONLY]: false,
    [SwitchType.SORT_BY_COUNT]: false,
};

interface BooleanFilterAccordionProps {
    filter: BooleanFilter,
};


export default function BooleanFilterAccordionSection(props: BooleanFilterAccordionProps) {
    const { filter } = props;
    const booleanFiltersConfig = config.filters.boolean;
    const logger = getLogger("BooleanFilterAccordionSection", filter.title);
    const [switchState, setSwitchState] = useLocalStorage2(`${filter.title}-switchState`, DEFAULT_SWITCH_STATE);

    const minTootsSliderDefaultValue: number = useMemo(
        () => computeDefaultValue(filter.options, filter.title),
        [filter.options]
    );

    const minTootsState = useState<number>(minTootsSliderDefaultValue);

    if (minTootsState[0] == 0 && minTootsSliderDefaultValue > 0) {
        logger.trace(`Updating minToots from default of 0 to ${minTootsSliderDefaultValue}`);
        minTootsState[1](minTootsSliderDefaultValue);
    }

    const makeHeaderSwitch = (switchType: SwitchType) => (
        <HeaderSwitch
            isChecked={switchState[switchType]}
            key={switchType}
            label={switchType}
            // TODO: this will unnecessarily call TheAlgorithm.filterFeed(). not a huge problem but not ideal.
            onChange={(e) => setSwitchState({...switchState, [switchType]: e.target.checked})}
        />
    );

    const headerSwitches = useMemo(
        () => {
            let _headerSwitches = [
                <HeaderSwitch
                    isChecked={filter.invertSelection} // TODO: this is modifying the filter directly which isn't great
                    key={SwitchType.INVERT_SELECTION}
                    label={SwitchType.INVERT_SELECTION}
                    onChange={(e) => filter.invertSelection = e.target.checked}
                />,
                makeHeaderSwitch(SwitchType.SORT_BY_COUNT)
            ];

            // Add a highlights-only switch if there are highlighted tooltips configured for this filter
            if (booleanFiltersConfig.optionsFormatting[filter.title]?.tooltips) {
                _headerSwitches = _headerSwitches.concat([makeHeaderSwitch(SwitchType.HIGHLIGHTS_ONLY)])
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
            switchState[SwitchType.HIGHLIGHTS_ONLY],
            switchState[SwitchType.SORT_BY_COUNT],
            minTootsSliderDefaultValue,
            minTootsState[0],
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
                highlightsOnly={switchState[SwitchType.HIGHLIGHTS_ONLY]}
                minToots={minTootsState[0]}
                sortByCount={switchState[SwitchType.SORT_BY_COUNT]}
            />
        </FilterAccordionSection>
    );
};
