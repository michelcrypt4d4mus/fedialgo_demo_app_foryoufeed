/*
 * Component for displaying a list of trending links, toots, or hashtags.
 */
import React, { CSSProperties, useMemo, useState } from "react";

import { capitalCase } from "change-case";
import {
    TagTootsCategory,
    TrendingType,
    optionalSuffix,
    type TagList,
    type TagWithUsageCounts,
    type TrendingObj,
} from "fedialgo";

import FilterAccordionSection from "./algorithm/FilterAccordionSection";
import MinTootsSlider, { computeDefaultValue } from "./helpers/MinTootsSlider";
import NewTabLink from "./helpers/NewTabLink";
import SubAccordion from "./helpers/SubAccordion";
import { boldFont, globalFont, linkesque, monoFont, roundedBox } from "../helpers/style_helpers";
import { config } from "../config";
import { getLogger } from "../helpers/log_helpers";
import { gridify, verticalSpacer } from "../helpers/react_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";

export type TrendingListObj = TrendingObj | string;
export type TrendingPanelName = TagTootsCategory | "toots" | TrendingType.LINKS | TrendingType.SERVERS;

export type LinkRenderer = {
    infoTxt?: (obj: TrendingListObj) => string;
    linkLabel: (obj: TrendingListObj) => React.ReactElement | string;
    linkUrl: (obj: TrendingListObj) => string;
    onClick: (obj: TrendingListObj, e: React.MouseEvent) => void;
};

// Either objectRenderer() OR linkRender must be provided in TrendingProps.
interface TrendingPropsBase {
    linkRenderer?: LinkRenderer;
    objRenderer?: (obj: TrendingListObj) => React.ReactElement;
};

interface TrendingTagListProps extends TrendingPropsBase {
    panelType?: never;  // panelType is not used when tagList is provided
    tagList: TagList;
    trendingObjs?: never;
};

interface TrendingObjsProps extends TrendingPropsBase {
    panelType: TrendingPanelName;
    tagList?: never;
    trendingObjs: TrendingListObj[];
};

// One of tagList or trendingObjs must be provided in TrendingProps.
type TrendingProps = TrendingTagListProps | TrendingObjsProps;


export default function TrendingSection(props: TrendingProps) {
    const { linkRenderer, objRenderer, tagList, trendingObjs } = props;
    const { isLoading } = useAlgorithm();

    const panelType = props.panelType ?? tagList?.source as TrendingPanelName;
    const logger = useMemo(() => getLogger("TrendingSection", panelType), []);
    logger.trace(`Rendering...`);

    if (!objRenderer && !linkRenderer) {
        logger.error("TrendingSection must have either objRenderer() or linkRenderer! props:", props);
        throw new Error("TrendingSection needs either objRenderer() or linkRenderer! props:");
    }

    const panelCfg = config.trending.panels[panelType];
    const objTypeLabel = panelCfg.objTypeLabel || panelType;
    const title = panelCfg.title || capitalCase(objTypeLabel);
    // const trendObjs = trendingObjs ?? tagList.topObjs();

    const trendObjs = useMemo(
        () => trendingObjs ?? tagList.topObjs(),
        [tagList, trendingObjs]
    )

    const minTootsSliderDefaultValue: number = useMemo(
        () => tagList ? computeDefaultValue(tagList, panelType, panelCfg.initialNumShown) : 0,
        [tagList]
    );

    const minTootsState = useState<number>(minTootsSliderDefaultValue);
    const [numShown, setNumShown] = useState(trendObjs.length ? Math.min(panelCfg.initialNumShown, trendObjs.length) : panelCfg.initialNumShown);

    // Memoize because react profiler says trending panels are most expensive to render
    const footer: React.ReactNode = useMemo(
        () => {
            // TagList uses the MinTootsSlider; other displays have a link to show all vs. show initialNumShown
            if (tagList || trendingObjs.length <= panelCfg.initialNumShown) return null;

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
        [isLoading, minTootsState[0], numShown, panelType, tagList, trendObjs, trendObjs.length]
    );

    // Memoize because react profiler says trending panels are most expensive to render
    const trendingItemList = useMemo(
        () => {
            let objs: TrendingListObj[] = trendObjs;
            logger.trace(`Rerendering list of ${objs.length} trending items...`);

            // TagList uses the MinTootsSlider; other displays have a link to show all vs. show initialNumShown
            if (tagList) {
                if (minTootsState[0] > 0) {
                    objs = trendObjs.filter((obj: TagWithUsageCounts) => obj.numToots >= minTootsState[0]);
                }
            } else {
                objs = objs.slice(0, numShown);
            }

            // Short circuit the rendering for custom object renderers (so far that's means just Toots)
            if (objRenderer) {
                return <>
                    {objs.map(objRenderer)}
                    {verticalSpacer(20, `trending-footer-${panelType}`)}
                    {footer}
                </>;
            }

            logger.trace(`Sliced trendObjs to ${objs.length} items (minTootsState=${minTootsState[0]}, numShown=${numShown})`);
            const { infoTxt, linkLabel, linkUrl, onClick } = linkRenderer!;
            const labels = objs.map(o => `${linkLabel(o)}${optionalSuffix(infoTxt, infoTxt(o))}`);
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
        [isLoading, minTootsState[0], numShown, panelCfg, panelType, tagList, trendObjs, trendObjs.length]
    );

    const slider = useMemo(
        () => {
            if (!tagList) return null;

            return (
                <MinTootsSlider
                    key={`${panelType}-minTootsSlider`}
                    minTootsState={minTootsState}
                    panelTitle={title}
                    pluralizedPanelTitle={title}
                    showLongTitle={false}  // TODO: This fucks up the layout if set to true
                    objList={tagList}
                />
            );
        },
        [minTootsState[0], tagList]
    )

    if (tagList) {
        return (
            <FilterAccordionSection
                isActive={false}
                switchbar={[slider]}
                title={title}
            >
                {trendingItemList}
            </FilterAccordionSection>
        )
    } else {
        return (
            <SubAccordion key={panelType} title={title}>
                {trendingItemList}
            </SubAccordion>
        );
    }
};


const boldTagLinkStyle: CSSProperties = {
    ...boldFont,
    ...globalFont,
    fontSize: config.theme.trendingObjFontSize - 2,
};

const colStyle: CSSProperties = {
    marginLeft: "1px",
    marginRight: "1px",
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
    ...boldFont,
    ...linkesque,
    ...monoFont,
    color: "#1b5b61",
    fontSize: config.theme.trendingObjFontSize - 1,
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
