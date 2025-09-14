/*
 * Checkbox that persists its state in local storage.
 * Requires there be a Checkbox somewhere in the component tree w/the same anchor!
 */
import Form from "react-bootstrap/Form";
import { ReactElement } from "react";

import { Tooltip } from "react-tooltip";

import { GuiCheckboxName, config } from "../../config";
import { tooltipZIndex } from "../../helpers/style_helpers";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { type GuiCheckboxLabel } from "../../helpers/tooltip_helpers";

export const CHECKBOX_TOOLTIP_ANCHOR = "checkbox-tooltip-anchor";

// Current state, checkbox, and a Tooltip (which will be shared by all checkboxes w/same anchor)
type StateWithComponent = [boolean, ReactElement, ReturnType<typeof Tooltip>];


/**
 * Build a checkbox whose state will be preserved in browser storage. The tooltip component returned
 * must be included somewhere in the component tree for the tooltip to work.
 * @param {GuiCheckboxName} checkboxName - Name of the checkbox as defined in config.timeline.guiCheckboxLabels
 * @returns {StateWithComponent} Tuple of [value, checkbox component, tooltip component]
 */
export default function persistentCheckbox(checkboxName: GuiCheckboxName): StateWithComponent {
    const labelAndTooltip: GuiCheckboxLabel = config.timeline.guiCheckboxLabels[checkboxName];
    const tooltipAnchor = labelAndTooltip.anchor || CHECKBOX_TOOLTIP_ANCHOR;
    const [value, setValue] = useLocalStorage(labelAndTooltip.label, labelAndTooltip.defaultValue);
    let checkbox: ReactElement;

    checkbox = (
        <Form.Check
            checked={value}
            label={labelAndTooltip.label}
            onChange={(e) => {
                setValue(e.target.checked);
            }}
            style={{fontSize: 14}}
            type="checkbox"
        />
    );

    if (labelAndTooltip.tooltipText) {
        checkbox = (
            <a
                data-tooltip-id={tooltipAnchor}
                data-tooltip-content={labelAndTooltip.tooltipText}
                key={`${labelAndTooltip.label}-tooltip-anchor`}
            >
                {checkbox}
            </a>
        );
    }

    return [
        value,
        checkbox,
        <Tooltip
            delayShow={config.timeline.tooltips.defaultTooltipDelayMS}
            id={tooltipAnchor}
            place="bottom"
            style={tooltipZIndex}
        />
    ];
};
