/*
 * Component for checkboxes that drive the user's filter settings.
 */
import React, { CSSProperties, useState } from "react";
import Form from 'react-bootstrap/esm/Form';

import { capitalCase } from "change-case";
import { Tooltip } from 'react-tooltip';
import { type BooleanFilterOption } from "fedialgo";

import { boldFont, linkesque, tooltipZIndex } from "../../../helpers/style_helpers";
import { config } from "../../../config";
import { CheckboxTooltipConfig } from '../../../helpers/tooltip_helpers';
import { followUri } from "../../../helpers/react_helpers";
import { useAlgorithm } from "../../../hooks/useAlgorithm";

const HASHTAG_ANCHOR = "user-hashtag-anchor";
const HIGHLIGHT = "highlighted";
const HIGHLIGHTED_TOOLTIP_ANCHOR = `${HASHTAG_ANCHOR}-${HIGHLIGHT}`;

export const HIGHLIGHTED_TOOLTIP = (
    <Tooltip id={HIGHLIGHTED_TOOLTIP_ANCHOR} place="top" style={tooltipZIndex} />
);

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
    const labelStyle: CSSProperties = {...boldFont};
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
                checked={isChecked}
                disabled={disabled}
                id={label}
                key={label + "_switch"}
                label={<>{labelNode}{labelExtra && ` (${labelExtra})`}</>}
                onChange={(e) => {
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
