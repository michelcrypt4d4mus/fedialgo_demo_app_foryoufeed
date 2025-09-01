/*
 * A text link with a tooltip.
 */
import React, { CSSProperties } from "react";

import { Tooltip } from "react-tooltip";

import { config } from "../../config";
import { linkesque, tooltipZIndex } from "../../helpers/style_helpers";
import { type LinkWithTooltipCfg } from "../../helpers/tooltip_helpers";

const TOOLTIPPED_LINK_ANCHOR = "tooltipped-link-anchor";

interface TooltippedLinkProps {
    anchor?: string;
    labelAndTooltip: LinkWithTooltipCfg;
    onClick: () => void;
};


export default function TooltippedLink(props: TooltippedLinkProps) {
    const { anchor, onClick, labelAndTooltip: { label, labelStyle, tooltipText } } = props;

    return (<>
        {/* Make sure there's a <Tooltip> to anchor to. */}
        <Tooltip
            border={"solid"}
            delayShow={config.timeline.tooltips.defaultTooltipDelayMS}
            id={TOOLTIPPED_LINK_ANCHOR}
            opacity={0.95}
            place="bottom"
            style={tooltipStyle}
            variant="light"
        />

        <a data-tooltip-content={tooltipText} data-tooltip-id={anchor || TOOLTIPPED_LINK_ANCHOR}>
            <span onClick={onClick} style={labelStyle || linkesque}>
                {label}
            </span>
        </a>
    </>);
};


const tooltipStyle: CSSProperties = {
    ...tooltipZIndex,
    fontSize: 16,
};
