/*
 * Component for checkboxes that drive the user's filter settings.
 */
import React, { CSSProperties, useState } from "react";
import Form from 'react-bootstrap/esm/Form';

import { capitalCase } from "change-case";
import { Tooltip } from 'react-tooltip';
import { type BooleanFilterOption } from "fedialgo";

import { config } from "../../../config";
import { CheckboxTooltipConfig } from '../../../helpers/tooltip_helpers';
import { followUri } from "../../../helpers/react_helpers";
import { getLogger } from "../../../helpers/log_helpers";
import { linkesque, tooltipZIndex } from "../../../helpers/style_helpers";
import { useAlgorithm } from "../../../hooks/useAlgorithm";

const HASHTAG_ANCHOR = "user-hashtag-anchor";
const HIGHLIGHT = "highlighted";
const HIGHLIGHTED_TOOLTIP_ANCHOR = `${HASHTAG_ANCHOR}-${HIGHLIGHT}`;

export const HIGHLIGHTED_TOOLTIP = (
    <Tooltip id={HIGHLIGHTED_TOOLTIP_ANCHOR} place="top" style={tooltipZIndex} />
);

const logger = getLogger("FilterCheckbox");

interface FilterCheckboxProps {
    capitalize?: boolean,
    disabled?: boolean,
    isChecked: boolean,
    label: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    option?: BooleanFilterOption,
    skipUpdateFilters?: boolean,
    tooltip?: CheckboxTooltipConfig,
    url?: string,
};


export default function FilterCheckbox(props: FilterCheckboxProps) {
    let { capitalize, disabled, isChecked, label, option, onChange, skipUpdateFilters, tooltip, url } = props;
    const { algorithm } = useAlgorithm();

    const labelExtra = option?.numToots?.toLocaleString();
    const labelStyle: CSSProperties = {...defaultLabelStyle};
    const [isCheckedState, setIsCheckedState] = useState(isChecked);
    let style: CSSProperties = {color: "black"};
    let tooltipAnchor = tooltip?.anchor || HASHTAG_ANCHOR;

    if (tooltip?.highlight?.color) {
        style = {...highlightedCheckboxStyle, ...style, backgroundColor: tooltip.highlight.color};
        tooltipAnchor = HIGHLIGHTED_TOOLTIP_ANCHOR;
    }

    if (capitalize) {
        label = capitalCase(label);
        labelStyle.fontSize = "14px";
    }

    if (label.length > config.filters.boolean.maxLabelLength) {
        label = `${label.slice(0, config.filters.boolean.maxLabelLength)}...`;
    }

    let labelNode = <span style={labelStyle}>{label}</span>;

    if (url) {
        // Use a span because you can't use an <a> tag inside the <a> tag we need for the tooltip
        labelNode = (
            <span onClick={(e) => followUri(url, e)} style={{...labelStyle, ...hashtagLink}}>
                {label}
            </span>
        );
    }

    return (
        <a data-tooltip-id={tooltipAnchor} data-tooltip-content={tooltip?.text} key={label}>
            <Form.Switch
                checked={isCheckedState}
                // className={"btn-check"}
                disabled={disabled}
                id={label}
                key={label + "_switch"}
                label={<>{labelNode}{labelExtra && ` (${labelExtra})`}</>}
                onChange={(e) => {
                    setIsCheckedState(e.target.checked);
                    onChange(e);
                    !skipUpdateFilters && algorithm?.updateFilters(algorithm.filters);
                }}
                style={{...style}}
            />
        </a>
    );
};


const hashtagLink: CSSProperties = {
    ...linkesque,
    color: "black",
};

const highlightedCheckboxStyle: CSSProperties = {
    backgroundColor: "cyan",
    borderRadius: "12px"
};

const defaultLabelStyle: CSSProperties = {
    fontWeight: "bold",
};
