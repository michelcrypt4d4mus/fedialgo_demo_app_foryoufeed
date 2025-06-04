/*
 * Checkbox that persists its state in local storage.
 * Requires there be a Checkbox somewhere in the component tree w/the same anchor!
 */
import Form from 'react-bootstrap/Form';
import { ReactElement } from "react";

import { Tooltip } from 'react-tooltip';

import HeaderSwitch from '../algorithm/filters/HeaderSwitch';
import { BooleanState } from '../../types';
import { CheckboxTooltipConfig } from '../../helpers/tooltip_helpers';
import { tooltipZIndex } from '../../helpers/style_helpers';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export const CHECKBOX_TOOLTIP_ANCHOR = "checkbox-tooltip-anchor";

// Current state, checkbox, and a Tooltip (which will be shared by all checkboxes w/same anchor)
type StateWithComponent = [boolean, ReactElement, ReturnType<typeof Tooltip>];

interface PersistentCheckboxProps {
    className?: string,
    isChecked?: boolean,
    label: string,
    state?: BooleanState,  // Optional if you want to manage state outside this component
    tooltipConfig?: CheckboxTooltipConfig,
    useSwitch?: boolean,  // Optional, if true will use HeaderSwitch instead of a checkbox
};


// Note this returns an array!
export default function persistentCheckbox(props: PersistentCheckboxProps): StateWithComponent {
    const { className, isChecked, label, state, tooltipConfig, useSwitch } = props;
    const tooltipAnchor = tooltipConfig?.anchor || CHECKBOX_TOOLTIP_ANCHOR;
    const [value, setValue] = state || useLocalStorage({keyName: label, defaultValue: isChecked || false});
    let checkbox: ReactElement;

    const tooltip = <Tooltip
        delayShow={800}
        id={tooltipAnchor}
        place="bottom"
        style={tooltipZIndex}
    />;

    if (useSwitch) {
        checkbox = (
            <HeaderSwitch
                isChecked={value}
                key={`${label}-switch`}
                label={label}
                onChange={(e) => setValue(e.target.checked)}
                tooltip={tooltipConfig}
            />
        );

        return [value, checkbox, tooltip];
    }

    checkbox = (
        <Form.Check
            checked={value}
            className={className || ''}
            key={`${label}-checkbox`}
            label={label}
            onChange={(e) => {
                setValue(e.target.checked);
            }}
            type="checkbox"
        />
    );

    if (tooltipConfig) {
        checkbox = (
            <a
                data-tooltip-id={tooltipAnchor}
                data-tooltip-content={tooltipConfig.text}
                key={`${label}-tooltip-anchor`}
            >
                <Form.Check
                    checked={value}
                    className={className || ''}
                    key={`${label}-checkbox`}
                    label={label}
                    onChange={(e) => setValue(e.target.checked)}
                    type="checkbox"
                />
            </a>
        );
    }

    return [value, checkbox, tooltip];
};
