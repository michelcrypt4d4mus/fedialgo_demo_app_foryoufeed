/*
 * Component for checkboxes that drive the user's filter settings.
 */
import React, { CSSProperties, useState } from "react";
import Form from 'react-bootstrap/esm/Form';

import tinycolor from "tinycolor2";
import { capitalCase } from "change-case";
import { Tooltip } from 'react-tooltip';
import { TypeFilterName } from "fedialgo";

import { config } from "../../../config";
import { followUri } from "../../../helpers/react_helpers";
import { linkesque, tooltipZIndex } from "../../../helpers/style_helpers";
import { useAlgorithm } from "../../../hooks/useAlgorithm";

export type GradientDataSource = TypeFilterName.PARTICIPATED_TAGS | TypeFilterName.TRENDING_TAGS;

export type CheckboxColorGradient = {
    // Sometimes we want to adjust the gradient instad of using the one between the endpoints to make any of the
    // colors visible (e.g. when the user has one tag they participate in A LOT the rest will be undifferentiated)
    adjustment?: {
        adjustPctiles: number[];
        minTagsToAdjust: number;
    },
    dataSource: GradientDataSource;
    endpoints: [tinycolor.Instance, tinycolor.Instance];
    textSuffix: (n: number) => string;
};

export type CheckboxTooltip = {
    anchor?: string;
    highlight?: CheckboxColor | CheckboxColoredByGradient; // Union type forces exactly one of 'color' or 'gradient' props
    text: string;
};

type CheckboxColor = { color: CSSProperties["color"]; gradient?: never; };
type CheckboxColoredByGradient = { color?: never; gradient: CheckboxColorGradient; };


const HASHTAG_ANCHOR = "user-hashtag-anchor";
const HIGHLIGHT = "highlighted";
const HIGHLIGHTED_TOOLTIP_ANCHOR = `${HASHTAG_ANCHOR}-${HIGHLIGHT}`;

export const HIGHLIGHTED_TOOLTIP = (
    <Tooltip id={HIGHLIGHTED_TOOLTIP_ANCHOR} place="top" style={tooltipZIndex} />
);

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
    const labelStyle: CSSProperties = {...defaultLabelStyle};
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
