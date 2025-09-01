/*
 * Component for the switches in the header of filter sections (invert selection,
 * sort by count, etc.).
 */
import { ChangeEvent } from "react";

import { TagTootsCategory } from "fedialgo";
import { Tooltip } from "react-tooltip";

import FilterCheckbox from "./FilterCheckbox";
import { CheckboxTooltipConfig } from "../../../helpers/tooltip_helpers";
import { config } from "../../../config";
import { getLogger } from "../../../helpers/log_helpers";
import { SwitchType, tooltipZIndex } from "../../../helpers/style_helpers";
import { useAlgorithm } from "../../../hooks/useAlgorithm";

const HEADER_SWITCH_TOOLTIP_ANCHOR = `header-switch-tooltip-anchor`;

const TAG_HIGHLIGHT_LABELS: Record<TagTootsCategory, string> = {
    [TagTootsCategory.FAVOURITED]: "Color Favourites",
    [TagTootsCategory.PARTICIPATED]: "Color Participated",
    [TagTootsCategory.TRENDING]: "Color Trending",
};

// Only invert selection requires a call to fedialgo's updateFilters() method
const SKIP_UPDATE_FILTERS_SWITCHES = [
    ...Object.values(TagTootsCategory),
    SwitchType.HIGHLIGHTS_ONLY,
    SwitchType.SORT_BY_COUNT,
];

const logger = getLogger("HeaderSwitch");

// This must appear somewhere in the component tree for the header switch tooltips to work
export const HEADER_SWITCH_TOOLTIP = (
    <Tooltip
        delayShow={config.filters.headerSwitches.tooltipHoverDelay}
        id={HEADER_SWITCH_TOOLTIP_ANCHOR}
        place="top"
        style={tooltipZIndex}
    />
);

interface HeaderSwitchProps {
    isChecked: boolean;
    label: SwitchType | TagTootsCategory;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    tooltipText?: string;
    tooltip?: CheckboxTooltipConfig;
};


export default function HeaderSwitch(props: HeaderSwitchProps) {
    let { isChecked, label, onChange, tooltip, tooltipText } = props;
    const { showFilterHighlights } = useAlgorithm();

    if (tooltipText && tooltip) {
        logger.warn(`HeaderSwitch received both tooltipText and tooltip props, ignoring tooltipText: ${tooltipText}`);
    }

    tooltip ||= {
        anchor: HEADER_SWITCH_TOOLTIP_ANCHOR,
        text: tooltipText || config.filters.headerSwitches.tooltipText[label],
    };

    return (
        <FilterCheckbox
            capitalize={true}
            disabled={(label == SwitchType.HIGHLIGHTS_ONLY) && !showFilterHighlights}
            isChecked={isChecked}
            label={TAG_HIGHLIGHT_LABELS[label] || label}
            onChange={onChange}
            skipUpdateFilters={SKIP_UPDATE_FILTERS_SWITCHES.includes(label)}
            tooltip={tooltip}
        />
    );
};
