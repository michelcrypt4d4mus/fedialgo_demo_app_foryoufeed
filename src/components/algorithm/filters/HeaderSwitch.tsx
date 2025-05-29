/*
 * Component for the switches in the header of filter sections (invert selection,
 * sort by count, etc.).
 */
import { ChangeEvent } from "react";

import { Tooltip } from 'react-tooltip';

import FilterCheckbox from "./FilterCheckbox";
import { config, SwitchType } from "../../../config";
import { TOOLTIP_ANCHOR, tooltipZIndex } from "../../../helpers/style_helpers";

const HEADER_SWITCH_TOOLTIP_ANCHOR = `${TOOLTIP_ANCHOR}-header-switch`;

// This must appear somewhere in the component tree for the header switch tooltips to work
export const HEADER_SWITCH_TOOLTIP = (
    <Tooltip
        delayShow={config.tooltips.headerDelay}
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
                text: tooltipText || config.tooltips.filterHeaderSwitchTooltips[label],
            }}
        />
    );
};
