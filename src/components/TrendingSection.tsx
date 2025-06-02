/*
 * Component for displaying a list of trending links, toots, or hashtags.
 */
import React, { CSSProperties, useMemo, useState } from "react";

import { capitalCase } from "change-case";
import {
    type TagWithUsageCounts,
    type TrendingData,
    type TrendingObj,
    ScoreName,
    TagList,
} from "fedialgo";

import FilterAccordionSection from "./algorithm/FilterAccordionSection";
import MinTootsSlider, { computeDefaultValue } from "./helpers/MinTootsSlider";
import NewTabLink from "./helpers/NewTabLink";
import SubAccordion from "./helpers/SubAccordion";
import { config } from "../config";
import { getLogger } from "../helpers/log_helpers";
import { globalFont, linkesque, roundedBox } from "../helpers/style_helpers";
import { gridify, verticalSpacer } from "../helpers/react_helpers";

export type TrendingListObj = TrendingObj | string;
export type TrendingPanelName = ScoreName.PARTICIPATED_TAGS | keyof TrendingData;

type LinkRenderer = {
    infoTxt?: (obj: TrendingListObj) => string;
    linkLabel: (obj: TrendingListObj) => React.ReactElement | string;
    linkUrl: (obj: TrendingListObj) => string;
    onClick: (obj: TrendingListObj, e: React.MouseEvent) => void;
};

const PANEL_TYPES_WITH_SLIDER: TrendingPanelName[] = [
    ScoreName.PARTICIPATED_TAGS,
    "tags",
]

// Either objectRenderer() OR linkRender must be provided in TrendingProps.
interface TrendingProps {
    linkRenderer?: LinkRenderer;
    objRenderer?: (obj: TrendingListObj) => React.ReactElement;
    panelType: TrendingPanelName;
    trendingObjs: TrendingListObj[];
};


export default function TrendingSection(props: TrendingProps) {
    let { linkRenderer, objRenderer, panelType, trendingObjs } = props;
    const logger = useMemo(() => getLogger("TrendingSection", panelType), [panelType]);

    if (!objRenderer && !linkRenderer) {
        logger.error("TrendingSection must have either objRenderer() or linkRenderer! props:", props);
        throw new Error("TrendingSection needs either objRenderer() or linkRenderer! props:");
    }

    // Configuration from TRENDING_PANEL_CFG based on panelType prop
    const panelCfg = config.trending.panels[panelType];
    const objTypeLabel = panelCfg.objTypeLabel || panelType;
    const title = panelCfg.title || capitalCase(objTypeLabel);
    const useSwitchbar = PANEL_TYPES_WITH_SLIDER.includes(panelType);

    const minTootsSliderDefaultValue: number = useMemo(
        () => {
            if (useSwitchbar) {
                return computeDefaultValue(
                    new TagList(trendingObjs as TagWithUsageCounts[]),
                    panelType,
                    panelCfg.initialNumShown
                );
            } else {
                return 0;
            }
        },
        [trendingObjs]
    );

    const minTootsState = useState<number>(minTootsSliderDefaultValue);
    const [numShown, setNumShown] = useState(Math.min(panelCfg.initialNumShown, trendingObjs.length));

    // Memoize because react profiler says trending panels are most expensive to render
    const footer: React.ReactNode = useMemo(
        () => {
            if (useSwitchbar || trendingObjs.length <= panelCfg.initialNumShown) return null;

            const toggleShown = () => {
                if (numShown === panelCfg.initialNumShown) {
                    setNumShown(trendingObjs.length);
                } else {
                    setNumShown(panelCfg.initialNumShown);
                }
            };

            return (
                <div key={`footer-${title}`} style={footerContainer}>
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
        [minTootsState[0], numShown, panelType, trendingObjs.length]
    );

    // Memoize because react profiler says trending panels are most expensive to render
    const trendingItemList = useMemo(
        () => {
            let objs: TrendingListObj[] = trendingObjs;

            if (useSwitchbar) {
                if (minTootsState[0] > 0) {
                    objs = trendingObjs.filter((obj: TagWithUsageCounts) => obj.numToots >= minTootsState[0]);
                } else {
                    objs = trendingObjs;
                }
            } else {
                objs = trendingObjs.slice(0, numShown);
            }

            // Short circuit the rendering for custom object renderers (so far that's means just Toots)
            if (objRenderer) {
                return <>
                    {objs.map((obj, i) => objRenderer(obj))}
                    {verticalSpacer(20, `trending-footer-${panelType}`)}
                    {footer}
                </>;
            }

            logger.trace(`Sliced trendingObjs to ${objs.length} items (minTootsState=${minTootsState[0]}, numShown=${numShown})`);
            const { infoTxt, linkLabel, linkUrl, onClick } = linkRenderer!;
            const labels = trendingObjs.map(o => linkLabel(o).toString() + (infoTxt ? ` (${infoTxt(o)})` : ''));
            const maxLength = Math.max(...labels.map(label => label.length));
            const longestLabel = labels.find(label => label.length === maxLength) || "";
            const isSingleCol = panelCfg.hasCustomStyle || (maxLength > config.trending.maxLengthForMulticolumn);
            logger.trace(`Rebuilding trendingItemList, longest label="${longestLabel}" (len=${maxLength}, isSingleCol=${isSingleCol})`);
            let containerStyle: CSSProperties;

            if (panelCfg.hasCustomStyle) {
                containerStyle = singleColumn;
            } else if (isSingleCol) {
                containerStyle = singleColumnPadded;
            } else {
                containerStyle = trendingListContainer;
            }

            const elements = objs.map((obj, i) => (
                <li key={`${title}-${i}-list-item`} style={listItemStyle}>
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
        [minTootsState[0], numShown, panelCfg, panelType, trendingObjs, trendingObjs.length]
    );

    if (useSwitchbar) {
        return (
            <FilterAccordionSection
                isActive={false}
                switchbar={[
                    <MinTootsSlider
                        key={`${panelType}-minTootsSlider`}
                        minTootsState={minTootsState}
                        panelTitle={title}
                        pluralizedPanelTitle={title}
                        showLongTitle={false}  // TODO: This fucks up the layout if set to true
                        tagList={new TagList(trendingObjs as TagWithUsageCounts[])}
                    />
                ]}
                title={title}
            >
                {trendingItemList}
            </FilterAccordionSection>
        )
    }
    return (
        <SubAccordion key={panelType} title={title}>
            {trendingItemList}
        </SubAccordion>
    );
};


const boldTagLinkStyle: CSSProperties = {
    ...globalFont,
    fontSize: config.theme.trendingObjFontSize - 2,
    fontWeight: "bold",
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
