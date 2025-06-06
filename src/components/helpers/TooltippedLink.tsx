/*
 * A text link with a tooltip.
 */
import { CSSProperties } from "react";

import { Tooltip } from "react-tooltip";

import { config } from "../../config";
import { getLogger } from "../../helpers/log_helpers";
import { tooltipZIndex } from "../../helpers/style_helpers";

const TOOLTIPPED_LINK_ANCHOR = "tooltipped-link-anchor";

interface TooltippedLinkProps {
    anchor?: string;
    label: string;
    onClick: () => void;
    labelStyle: React.CSSProperties;
    tooltipText?: string;
};


export default function TooltippedLink(props: TooltippedLinkProps) {
    let { anchor, onClick, label, labelStyle, tooltipText } = props;

    return (<>
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
            <span onClick={onClick} style={labelStyle}>
                {label}
            </span>
        </a>
    </>);
};


const tooltipStyle: CSSProperties = {
    ...tooltipZIndex,
    fontSize: "16px",
};
