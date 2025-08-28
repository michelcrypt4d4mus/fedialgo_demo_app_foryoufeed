/*
 * Checkbox that persists its state in local storage.
 * Requires there be a Checkbox somewhere in the component tree w/the same anchor!
 */
import Form from 'react-bootstrap/Form';
import { ReactElement } from "react";

import { Tooltip } from 'react-tooltip';

import { config } from '../../config';
import { tooltipZIndex } from '../../helpers/style_helpers';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { type BooleanState } from '../../types';
import { type GuiCheckboxLabel } from '../../helpers/tooltip_helpers';

export const CHECKBOX_TOOLTIP_ANCHOR = "checkbox-tooltip-anchor";

// Current state, checkbox, and a Tooltip (which will be shared by all checkboxes w/same anchor)
type StateWithComponent = [boolean, ReactElement, ReturnType<typeof Tooltip>];

interface PersistentCheckboxProps {
    className?: string,
    isChecked?: boolean,
    labelAndTooltip: GuiCheckboxLabel,
    state?: BooleanState,  // Optional if you want to manage state outside this component
};


// Note this returns an array!
export default function persistentCheckbox(props: PersistentCheckboxProps): StateWithComponent {
    const { className, isChecked, labelAndTooltip, state } = props;
    const tooltipAnchor = labelAndTooltip?.anchor || CHECKBOX_TOOLTIP_ANCHOR;
    const [value, setValue] = state || useLocalStorage(labelAndTooltip.label, isChecked || false);
    let checkbox: ReactElement;

    const tooltip = <Tooltip
        delayShow={config.timeline.tooltips.defaultTooltipDelayMS}
        id={tooltipAnchor}
        place="bottom"
        style={tooltipZIndex}
    />;

    checkbox = (
        <Form.Check
            checked={value}
            className={className || ''}
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

    return [value, checkbox, tooltip];
};
