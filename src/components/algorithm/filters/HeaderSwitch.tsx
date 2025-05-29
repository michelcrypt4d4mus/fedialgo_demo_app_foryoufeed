/*
 * Component for the switches in the header of filter sections (invert selection,
 * sort by count, etc.).
 */
import { ChangeEvent } from "react";

import { Tooltip } from 'react-tooltip';

import FilterCheckbox from "./FilterCheckbox";
import { TOOLTIP_ANCHOR, tooltipZIndex } from "../../../helpers/style_helpers";

export enum SwitchType {
    HIGHLIGHTS_ONLY = "highlightsOnly",
    INVERT_SELECTION = "invertSelection",
    SORT_BY_COUNT = "sortByCount",
};

const SWITCH_TOOLTIPS: Record<SwitchType, string> = {
    [SwitchType.HIGHLIGHTS_ONLY]: "Only show the colored options",
    [SwitchType.INVERT_SELECTION]: "Exclude selected options",
    [SwitchType.SORT_BY_COUNT]: "Sort the list of options by the number of toots",
};

const HEADER_SWITCH_TOOLTIP_ANCHOR = `${TOOLTIP_ANCHOR}-header-switch`;
const HEADER_SWITCH_TOOLTIP_DELAY_MS = 500;  // TODO: config

// This must appear somewhere in the component tree for the header switch tooltips to work
export const HEADER_SWITCH_TOOLTIP = (
    <Tooltip
        delayShow={HEADER_SWITCH_TOOLTIP_DELAY_MS}
        id={HEADER_SWITCH_TOOLTIP_ANCHOR}
        place="top"
        style={tooltipZIndex}
    />
);

interface HeaderSwitchProps {
    isChecked: boolean;
    label: SwitchType;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    tooltipText?: string;
};


export default function HeaderSwitch(props: HeaderSwitchProps) {
    const { isChecked, label, onChange, tooltipText } = props;

    return (
        <FilterCheckbox
            capitalize={true}
            isChecked={isChecked}
            label={label}
            onChange={onChange}
            tooltip={{
                anchor: HEADER_SWITCH_TOOLTIP_ANCHOR,
                text: tooltipText || SWITCH_TOOLTIPS[label],
            }}
        />
    );
};
