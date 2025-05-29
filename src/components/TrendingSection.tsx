/*
 * Component for displaying a list of trending links, toots, or hashtags.
 */
import React, { CSSProperties, useMemo, useState } from "react";

import { type TrendingData, type TrendingObj } from "fedialgo";

import NewTabLink from "./helpers/NewTabLink";
import SubAccordion from "./helpers/SubAccordion";
import { ComponentLogger } from "../helpers/log_helpers";
import { config } from "../config";
import { globalFont, linkesque, roundedBox } from "../helpers/style_helpers";
import { gridify } from "../helpers/react_helpers";
import { trendingTypeForString } from "../helpers/string_helpers";

const NUM_SHOWN_FOR_TYPE: Record<keyof TrendingData, number | undefined> = {
    links: config.trending.numLinksToShow,
    tags: config.trending.numHashtagsToShow,
    servers: config.trending.numServersToShow, // unused
    toots: config.trending.numTootsToShow,
};

type TrendingListObj = TrendingObj | string;

interface TrendingProps {
    hasCustomStyle?: boolean;
    infoTxt?: (obj: TrendingListObj) => string;
    linkLabel: (obj: TrendingListObj) => React.ReactElement | string;
    linkUrl: (obj: TrendingListObj) => string;
    onClick: (obj: TrendingListObj, e: React.MouseEvent) => void;
    title: string;
    trendingObjs: TrendingListObj[];
};


export default function TrendingSection(props: TrendingProps) {
    const { hasCustomStyle, infoTxt, linkLabel, linkUrl, onClick, title, trendingObjs } = props;
    const logger = useMemo(() => new ComponentLogger("TrendingSection", title), [title]);
    const objType = trendingTypeForString(title);

    const initialNumShown = NUM_SHOWN_FOR_TYPE[objType] ?? trendingObjs.length;
    const [currentNumShown, setCurrentNumShown] = useState(initialNumShown);

    // Memoize because react profiler says trending panels are most expensive to render
    const footer: React.ReactNode = useMemo(
        () => {
            if (trendingObjs.length <= initialNumShown) return null;
            const objTypeLabel = objType == "tags" ? "hashtags" : objType;

            const toggleShown = () => {
                if (currentNumShown === initialNumShown) {
                    setCurrentNumShown(trendingObjs.length);
                } else {
                    setCurrentNumShown(initialNumShown);
                }
            };

            return (
                <div style={footerContainer}>
                    <div style={{width: "40%"}}>{'('}
                        <a onClick={toggleShown} style={footerLink}>
                            {currentNumShown === initialNumShown
                                ? `show all ${trendingObjs.length} ${objTypeLabel}`
                                : `show fewer ${objTypeLabel}`}
                        </a>{')'}
                    </div>
                </div>
            );
        },
        [currentNumShown, title, trendingObjs.length]
    );

    // Memoize because react profiler says trending panels are most expensive to render
    const trendingItemList = useMemo(
        () => {
            const labels = trendingObjs.map(o => linkLabel(o).toString() + (infoTxt ? ` (${infoTxt(o)})` : ''));
            const maxLength = Math.max(...labels.map(label => label.length));
            const longestLabel = labels.find(label => label.length === maxLength) || "";
            const useMulticolumn = !hasCustomStyle && (maxLength <= config.trending.maxLengthForMulticolumn);
            logger.trace(`Longest label="${longestLabel}" (length=${maxLength}, useMulticolumn=${useMulticolumn})`);

            const elements = trendingObjs.slice(0, currentNumShown).map((obj, i) => (
                <li key={i} style={listItemStyle}>
                    <NewTabLink
                        href={linkUrl(obj)}
                        onClick={(e) => onClick(obj, e)}
                        style={hasCustomStyle ? linkFont : boldTagLinkStyle}
                    >
                        {linkLabel(obj)}
                    </NewTabLink>

                    {infoTxt && <span style={infoTxtStyle}>({infoTxt(obj)})</span>}
                </li>
            ));

            return (
                <div style={useMulticolumn ? trendingListContainer : singleColumn }>
                    <ol style={listStyle}>
                        {useMulticolumn ? gridify(elements, 2, colStyle) : elements}
                    </ol>

                    {footer}
                </div>
            );
        },
        [currentNumShown, footer, hasCustomStyle, initialNumShown, trendingObjs, trendingObjs.length]
    );

    return (
        <SubAccordion key={title} title={title}>
            {trendingItemList}
        </SubAccordion>
    );
};


const colStyle: CSSProperties = {
    marginLeft: "5px",
    marginRight: "5px",
};

const footerContainer: CSSProperties = {
    display: "flex",
    justifyContent: 'space-around',
    width: "100%"
};

const footerLink: CSSProperties = {
    ...linkesque,
    color: "navy",
    fontSize: "16px",
    fontWeight: "bold",
};

const infoTxtStyle: CSSProperties = {
    fontSize: config.theme.trendingObjFontSize - 4,
    marginLeft: "6px",
};

const linkFont: CSSProperties = {
    ...globalFont,
    fontSize: config.theme.trendingObjFontSize - 1,
};

const listItemStyle: CSSProperties = {
    marginBottom: "4px",
};

const listStyle: CSSProperties = {
    fontSize: config.theme.trendingObjFontSize,
    listStyle: "numeric",
    paddingBottom: "10px",
    paddingLeft: "20px",
};

const boldTagLinkStyle: CSSProperties = {
    ...globalFont,
    fontSize: config.theme.trendingObjFontSize - 2,
    fontWeight: "bold",
};

const trendingListContainer: CSSProperties = {
    ...roundedBox,
    paddingTop: "20px",
};

const singleColumn: CSSProperties = {
    ...trendingListContainer,
    paddingLeft: "22px",
};
