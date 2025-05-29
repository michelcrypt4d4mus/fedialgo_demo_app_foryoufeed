/*
 * Component for displaying a list of trending links, toots, or hashtags.
 */
import React, { CSSProperties, useMemo, useState } from "react";

import { capitalCase } from "change-case";
import { ScoreName, type TrendingData, type TrendingObj, TrendingType } from "fedialgo";

import NewTabLink from "./helpers/NewTabLink";
import SubAccordion from "./helpers/SubAccordion";
import { ComponentLogger } from "../helpers/log_helpers";
import { config } from "../config";
import { globalFont, linkesque, roundedBox } from "../helpers/style_helpers";
import { gridify, verticalSpacer } from "../helpers/react_helpers";

export type TrendingListObj = TrendingObj | string;
export type TrendingPanel = ScoreName.PARTICIPATED_TAGS | keyof TrendingData;

type LinkRenderer = {
    infoTxt?: (obj: TrendingListObj) => string;
    linkLabel: (obj: TrendingListObj) => React.ReactElement | string;
    linkUrl: (obj: TrendingListObj) => string;
    onClick: (obj: TrendingListObj, e: React.MouseEvent) => void;
}

// TODO: should this be part of global config?
type TrendingPanelCfg = {
    description?: string;
    hasCustomStyle?: boolean;
    initialNumShown: number;
    objTypeLabel?: string;
    prependTrending?: boolean;
    title?: string;
};

const TRENDING_PANEL_CFG: Record<TrendingPanel, TrendingPanelCfg> = {
    [TrendingType.LINKS]: {
        hasCustomStyle: true, // links are always styled with custom CSS
        initialNumShown: config.trending.numLinksToShow,
        objTypeLabel: `trending ${TrendingType.LINKS}`
    },
    [ScoreName.PARTICIPATED_TAGS]: {
        initialNumShown: config.trending.numHashtagsToShow,
        objTypeLabel: "of your hashtags",
        title: "Hashtags You Post About The Most",
    },
    [TrendingType.SERVERS]: {
        description: "The Mastodon servers all these trending links, toots, and hashtags came from, sorted by the percentage of that server's monthly active users you follow:",
        initialNumShown: config.trending.numServersToShow, // unused
        objTypeLabel: TrendingType.SERVERS, // unused
        title: "Fediverse Servers That Were Scraped",
    },
    [TrendingType.TAGS]: {
        initialNumShown: config.trending.numHashtagsToShow,
        objTypeLabel: "trending hashtags",
    },
    toots: {
        initialNumShown: config.trending.numTootsToShow,
        objTypeLabel: "trending toots",
    },
};

// Either objectRenderer() OR linkRender must be provided in TrendingProps.
interface TrendingProps {
    linkRenderer?: LinkRenderer;
    objRenderer?: (obj: TrendingListObj) => React.ReactElement;
    panelType: TrendingPanel;
    trendingObjs: TrendingListObj[];
};


export default function TrendingSection(props: TrendingProps) {
    let { linkRenderer, objRenderer, panelType, trendingObjs } = props;
    const logger = useMemo(() => new ComponentLogger("TrendingSection", panelType), [panelType]);

    if (!objRenderer && !linkRenderer) {
        logger.error("TrendingSection must have either objRenderer() or linkRenderer! props:", props);
        throw new Error("TrendingSection needs either objRenderer() or linkRenderer! props:");
    }

    // Configuration from TRENDING_PANEL_CFG based on panelType prop
    const panelCfg = TRENDING_PANEL_CFG[panelType];
    const objTypeLabel = panelCfg.objTypeLabel || panelType;
    const title = panelCfg.title || capitalCase(objTypeLabel);
    const [numShown, setNumShown] = useState(Math.min(panelCfg.initialNumShown, trendingObjs.length));

    // Memoize because react profiler says trending panels are most expensive to render
    const footer: React.ReactNode = useMemo(
        () => {
            if (trendingObjs.length <= panelCfg.initialNumShown) return null;

            const toggleShown = () => {
                if (numShown === panelCfg.initialNumShown) {
                    setNumShown(trendingObjs.length);
                } else {
                    setNumShown(panelCfg.initialNumShown);
                }
            };

            return (
                <div style={footerContainer}>
                    <div style={{width: "40%"}}>{'('}
                        <a onClick={toggleShown} style={footerLinkText}>
                            {numShown == panelCfg.initialNumShown
                                ? `show all ${trendingObjs.length} ${objTypeLabel}`
                                : `show fewer ${objTypeLabel}`}
                        </a>{')'}
                    </div>
                </div>
            );
        },
        [numShown, panelType, trendingObjs.length]
    );

    // Memoize because react profiler says trending panels are most expensive to render
    const trendingItemList = useMemo(
        () => {
            const objs = trendingObjs.slice(0, numShown);

            // Short circuit the rendering for custom object renderers (meaning Toots)
            if (objRenderer) {
                return <>
                    {objs.map((obj, i) => objRenderer!(obj))}
                    {verticalSpacer(20, `trending-footer-${panelType}`)}
                    {footer}
                </>;
            }

            const { infoTxt, linkLabel, linkUrl, onClick } = linkRenderer!;
            const labels = trendingObjs.map(o => linkLabel(o).toString() + (infoTxt ? ` (${infoTxt(o)})` : ''));
            const maxLength = Math.max(...labels.map(label => label.length));
            const longestLabel = labels.find(label => label.length === maxLength) || "";
            const isSingleCol = panelCfg.hasCustomStyle || (maxLength > config.trending.maxLengthForMulticolumn);
            logger.trace(`Longest label="${longestLabel}" (length=${maxLength}, isSingleCol=${isSingleCol})`);
            let containerStyle: CSSProperties;

            if (panelCfg.hasCustomStyle) {
                containerStyle = singleColumn;
            } else if (isSingleCol) {
                containerStyle = singleColumnPadded;
            } else {
                containerStyle = trendingListContainer;
            }

            const elements = objs.map((obj, i) => (
                <li key={i} style={listItemStyle}>
                    <NewTabLink
                        href={linkUrl(obj)}
                        onClick={(e) => onClick(obj, e)}
                        style={panelCfg.hasCustomStyle ? linkFont : boldTagLinkStyle}
                    >
                        {linkLabel(obj)}
                    </NewTabLink>

                    {infoTxt && <span style={infoTxtStyle}>({infoTxt(obj)})</span>}
                </li>
            ));

            return (
                <div style={containerStyle}>
                    {panelCfg.description && <p style={descriptionStyle}>{panelCfg.description}</p>}

                    <ol style={listStyle}>
                        {isSingleCol ? elements : gridify(elements, 2, colStyle)}
                    </ol>

                    {footer}
                </div>
            );
        },
        [numShown, footer, panelCfg, panelType, trendingObjs, trendingObjs.length]
    );

    return (
        <SubAccordion key={panelType} title={title}>
            {trendingItemList}
        </SubAccordion>
    );
};


const colStyle: CSSProperties = {
    marginLeft: "5px",
    marginRight: "5px",
};

const descriptionStyle: CSSProperties = {
    ...globalFont,
    fontSize: config.theme.trendingObjFontSize,
    marginBottom: "18px",
    marginTop: "3px",
};

const footerContainer: CSSProperties = {
    display: "flex",
    justifyContent: 'space-around',
    marginBottom: "5px",
    width: "100%"
};

const footerLinkText: CSSProperties = {
    ...linkesque,
    color: "#1b5b61",
    fontFamily: "monospace",
    fontSize: config.theme.trendingObjFontSize - 1,
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
    paddingLeft: "25px",
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

const singleColumnPadded: CSSProperties = {
    ...singleColumn,
    paddingLeft: "40px",
};
