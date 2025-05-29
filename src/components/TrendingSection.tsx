/*
 * Component for displaying a list of trending links, toots, or hashtags.
 */
import React, { CSSProperties, useState } from "react";

import { type TrendingObj } from "fedialgo";

import NewTabLink from "./helpers/NewTabLink";
import SubAccordion from "./helpers/SubAccordion";
import { ComponentLogger } from "../helpers/log_helpers";
import { roundedBox } from "../helpers/style_helpers";

export const LINK_FONT_SIZE = 16;
type TrendingListObj = TrendingObj | string;

interface TrendingProps {
    footer?: React.ReactNode;
    hasCustomStyle?: boolean;
    infoTxt?: (obj: TrendingListObj) => string;
    linkLabel: (obj: TrendingListObj) => React.ReactElement | string;
    linkUrl: (obj: TrendingListObj) => string;
    onClick: (obj: TrendingListObj, e: React.MouseEvent) => void;
    title: string;
    trendingObjs: TrendingListObj[];
};


export default function TrendingSection(props: TrendingProps) {
    const { footer, hasCustomStyle, infoTxt, linkLabel, linkUrl, onClick, title, trendingObjs } = props;
    const linkStyle = hasCustomStyle ? tagLinkStyle : boldTagLinkStyle;

    const [logger, _setLogger] = useState(new ComponentLogger("TrendingSection", title));
    logger.trace(`Rendering ${trendingObjs.length} objects`);

    return (
        <SubAccordion key={title} title={title}>
            <div style={roundedBox}>
                <ol style={listStyle}>
                    {trendingObjs.map((obj, i) => (
                        <li key={i} style={listItemStyle}>
                            <NewTabLink href={linkUrl(obj)} onClick={e => onClick(obj, e)} style={linkStyle}>
                                {linkLabel(obj)}
                            </NewTabLink>

                            {infoTxt && <span style={infoTxtStyle}>({infoTxt(obj)})</span>}
                        </li>
                    ))}
                </ol>

                {footer}
            </div>
        </SubAccordion>
    );
};


const infoTxtStyle: CSSProperties = {
    fontSize: LINK_FONT_SIZE - 3,
    marginLeft: "6px",
};

const listItemStyle: CSSProperties = {
    marginBottom: "7px",
    marginTop: "7px",
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
    fontWeight: "bold",
};
