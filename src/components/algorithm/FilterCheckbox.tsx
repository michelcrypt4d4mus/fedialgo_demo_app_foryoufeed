/*
 * Component for checkboxes that drive the user's filter settings.
 */
import React, { CSSProperties, useState } from "react";
import Form from 'react-bootstrap/esm/Form';

import { capitalCase } from "change-case";

import { CheckboxTooltip } from "./FilterCheckboxGrid";
import { followUri } from "../../helpers/react_helpers";
import { linkesque } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

export const HASHTAG_ANCHOR = "user-hashtag-anchor";
export const HIGHLIGHT = "highlighted";

const MAX_LABEL_LENGTH = 21;

interface FilterCheckboxProps {
    capitalize?: boolean,
    isChecked: boolean,
    label: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    labelExtra?: number | string,
    tooltip?: CheckboxTooltip,
    url?: string,
};


export default function FilterCheckbox(props: FilterCheckboxProps) {
    let { capitalize, isChecked, label, labelExtra, onChange, tooltip, url } = props;
    const { algorithm } = useAlgorithm();

    const [isCheckedState, setIsCheckedState] = useState(isChecked);
    labelExtra = (typeof labelExtra == "number") ? labelExtra.toLocaleString() : labelExtra;
    const labelStyle = {...defaultLabelStyle};
    let style: CSSProperties = {color: "black"};
    let tooltipAnchor = HASHTAG_ANCHOR;

    if (tooltip) {
        style = {...highlightedCheckboxStyle, ...style, backgroundColor: tooltip.color};
        tooltipAnchor += HIGHLIGHT;
    }

    if (capitalize) {
        label = capitalCase(label);
        labelStyle.fontSize = "14px";
    } else {
        label = (label.length > (MAX_LABEL_LENGTH - 2)) ? `${label.slice(0, MAX_LABEL_LENGTH)}...` : label;
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
                id={label}
                key={label + "_switch"}
                label={<>{labelNode}{labelExtra && ` (${labelExtra})`}</>}
                onChange={(e) => {
                    setIsCheckedState(e.target.checked);
                    onChange(e);
                    algorithm?.updateFilters(algorithm.filters);
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
