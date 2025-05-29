/*
 * Component for displaying a list of trending links, toots, or hashtags.
 */
import React, { CSSProperties, useState } from "react";

import { type TrendingObj } from "fedialgo";

import NewTabLink from "./helpers/NewTabLink";
import SubAccordion from "./helpers/SubAccordion";
import { ComponentLogger } from "../helpers/log_helpers";
import { gridify } from "../helpers/react_helpers";
import { roundedBox } from "../helpers/style_helpers";

export const LINK_FONT_SIZE = 16;
type TrendingListObj = TrendingObj | string;

interface TrendingProps {
    footer?: React.ReactNode;
    hasCustomStyle?: boolean;
    infoTxt?: (obj: TrendingListObj) => string;
    linkLabel: (obj: TrendingListObj) => React.ReactElement | string;
    linkUrl: (obj: TrendingListObj) => string;
    multicolumn?: boolean;
    onClick: (obj: TrendingListObj, e: React.MouseEvent) => void;
    title: string;
    trendingObjs: TrendingListObj[];
};


export default function TrendingSection(props: TrendingProps) {
    const { footer, multicolumn, hasCustomStyle, infoTxt, linkLabel, linkUrl, onClick, title, trendingObjs } = props;
    const [logger, _setLogger] = useState(new ComponentLogger("TrendingSection", title));
    logger.trace(`Rendering ${trendingObjs.length} objects`);

    // The whole component is memoized so we don't bother memoizing here
    const elements = trendingObjs.map((obj, i) => (
        <li key={i} style={listItemStyle}>
            <NewTabLink
                href={linkUrl(obj)}
                onClick={e => onClick(obj, e)}
                style={hasCustomStyle ? tagLinkStyle : boldTagLinkStyle}
            >
                {linkLabel(obj)}
            </NewTabLink>

            {infoTxt && <span style={infoTxtStyle}>({infoTxt(obj)})</span>}
        </li>
    ));

    return (
        <SubAccordion key={title} title={title}>
            <div style={roundedBox}>
                <ol style={listStyle}>
                    {multicolumn ? gridify(elements, 2, colStyle) : elements}
                </ol>

                {footer}
            </div>
        </SubAccordion>
    );
};


const colStyle: CSSProperties = {
    marginLeft: "5px",
    marginRight: "5px",
}

const infoTxtStyle: CSSProperties = {
    fontSize: LINK_FONT_SIZE - 4,
    marginLeft: "6px",
};

const listItemStyle: CSSProperties = {
    marginBottom: "4px",
    // marginTop: "7px",
};

const listStyle: CSSProperties = {
    fontSize: LINK_FONT_SIZE,
    listStyle: "numeric",
    paddingBottom: "10px",
    paddingLeft: "20px",
};

const tagLinkStyle: CSSProperties = {
    color: "black",
};

const boldTagLinkStyle: CSSProperties = {
    ...tagLinkStyle,
    fontSize: LINK_FONT_SIZE - 1,
    fontWeight: "bold",
};
