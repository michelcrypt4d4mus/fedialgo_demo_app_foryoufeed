/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import TheAlgorithm, { Toot } from "fedialgo";
import { Tooltip } from 'react-tooltip';

import BugReportLink from "../components/helpers/BugReportLink";
import ExperimentalFeatures from "../components/experimental/ExperimentalFeatures";
import FilterSetter from "../components/algorithm/FilterSetter";
import LoadingSpinner, { fullPageCenteredSpinner } from "../components/helpers/LoadingSpinner";
import StatusComponent, { TOOLTIP_ACCOUNT_ANCHOR} from "../components/status/Status";
import TopLevelAccordion from "../components/helpers/TopLevelAccordion";
import TrendingInfo from "../components/TrendingInfo";
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/algorithm/WeightSetter";
import { buildStateCheckbox } from "../helpers/react_helpers";
import { config } from "../config";
import { confirm } from "../components/helpers/Confirmation";
import { getLogger } from "../helpers/log_helpers";
import { linkesque, tooltipZIndex } from "../helpers/style_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";
import { useError } from "../components/helpers/ErrorHandler";

const TOOLTIP_ANCHOR = "tooltip-anchor";
const logger = getLogger("Feed");


export default function Feed() {
    const { algorithm, isLoading, setShouldAutoUpdate, shouldAutoUpdate, timeline, triggerFeedUpdate } = useAlgorithm();
    const { setError } = useError();

    // State variables
    const hideLinkPreviewsState = useState(false);
    const isControlPanelStickyState = useState(true);  // Left panel stickiness
    const [isLoadingThread, setIsLoadingThread] = useState(false);
    const [numDisplayedToots, setNumDisplayedToots] = useState<number>(config.timeline.defaultNumDisplayedToots);
    const [prevScrollY, setPrevScrollY] = useState(0);
    const [scrollPercentage, setScrollPercentage] = useState(0);
    const [thread, setThread] = useState<Toot[]>([]);

    // Computed variables etc.
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);
    const leftColStyle: CSSProperties = isControlPanelStickyState[0] ? {} : {position: "relative"};
    const numShownToots = Math.max(config.timeline.defaultNumDisplayedToots, numDisplayedToots);

    // Reset all state except for the user and server
    const reset = async () => {
        if (!(await confirm(`Are you sure you want to clear all historical data?`))) return;
        setError("");
        setNumDisplayedToots(config.timeline.defaultNumDisplayedToots);
        if (!algorithm) return;
        await algorithm.reset();
        triggerFeedUpdate();
    };

    // Show more toots when the user scrolls to bottom of the page
    // TODO: this triggers twice: once when isbottom changes to true and again because numDisplayedToots
    //       is increased, triggering a second evaluation of the block
    useEffect(() => {
        const showMoreToots = () => {
            if (numDisplayedToots < timeline.length) {
                const msg = `Showing ${numDisplayedToots} toots, adding ${config.timeline.numTootsToLoadOnScroll}`;
                logger.log(`${msg} more (${timeline.length} available in feed)`);
                setNumDisplayedToots(numDisplayedToots + config.timeline.numTootsToLoadOnScroll);
            }
        };

        // If the user scrolls to the bottom of the page, show more toots
        if (isBottom && timeline.length) showMoreToots();
        // If there's less than numDisplayedToots in the feed set numDisplayedToots to the # of toots in the feed
        if (timeline?.length && timeline.length < numDisplayedToots) setNumDisplayedToots(timeline.length);

        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight; // Total height
            const scrollPosition = document.documentElement.scrollTop || window.scrollY; // Current scroll position
            const viewportHeight = document.documentElement.clientHeight; // Visible viewport height
            const totalScrollableHeight = scrollHeight - viewportHeight; // Scrollable distance
            const percentage = (scrollPosition / totalScrollableHeight) * 100;
            setScrollPercentage(percentage);

            if (percentage <= 50 && numDisplayedToots > (config.timeline.defaultNumDisplayedToots * 2)) {
                const newNumDisplayedToots = Math.floor(numDisplayedToots * 0.7);
                logger.log(`Scroll pctage less than 50%, lowering numDisplayedToots to ${newNumDisplayedToots}`);
                setNumDisplayedToots(newNumDisplayedToots);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isBottom, numDisplayedToots, prevScrollY, setNumDisplayedToots, setPrevScrollY, timeline]);

    // TODO: probably easier to not rely on fedialgo's measurement of the last load time; we can easily track it ourselves.
    let footerMsg = `Scored ${(timeline?.length || 0).toLocaleString()} toots`;
    footerMsg += (algorithm?.lastLoadTimeInSeconds) ? ` in ${algorithm?.lastLoadTimeInSeconds?.toFixed(1)} seconds` : '';

    const finishedLoadingMsg = (
        <p style={loadingMsgStyle}>
            {footerMsg} ({<a onClick={reset} style={resetLinkStyle}>clear all data and reload</a>})
        </p>
    );

    return (
        <Container fluid style={{height: "auto"}}>
            <Row style={{cursor: isLoadingThread ? 'wait' : 'default'}}>
                {/* Tooltip options: https://react-tooltip.com/docs/options */}
                <Tooltip id={TOOLTIP_ANCHOR} place="top" style={tooltipZIndex} />

                <Tooltip
                    border={"solid"}
                    clickable={true}
                    delayShow={100}
                    id={TOOLTIP_ACCOUNT_ANCHOR}
                    opacity={0.95}
                    place="left"
                    style={accountTooltipStyle}
                    variant="light"
                />

                <Col md={6} xs={12} >
                    {/* TODO: maybe the inset-inline-end property could be used to allow panel to scroll to length but still stick? */}
                    <div className="sticky-top left-col-scroll" style={leftColStyle}>
                        <div style={stickySwitchContainer}>
                            {buildStateCheckbox(`Stick Control Panel To Top`, isControlPanelStickyState, 'd-none d-sm-block')}
                            {buildStateCheckbox(`Hide Link Previews`, hideLinkPreviewsState)}

                            <a
                                data-tooltip-id={TOOLTIP_ANCHOR}
                                data-tooltip-content={config.timeline.checkboxTooltipText.autoupdate}
                                key={"tooltipautoload"}
                                style={{color: "white"}}
                            >
                                {buildStateCheckbox(`Auto Load New Toots`, [shouldAutoUpdate, setShouldAutoUpdate])}
                            </a>
                        </div>

                        {algorithm && <WeightSetter />}
                        {algorithm && <FilterSetter />}
                        {algorithm && <TrendingInfo />}
                        {algorithm && <ExperimentalFeatures />}

                        {(thread.length > 0) &&
                            <TopLevelAccordion onExited={() => setThread([])} startOpen={true} title="Thread">
                                {thread.map((toot, index) => (
                                    <StatusComponent
                                        fontColor="black"
                                        hideLinkPreviews={hideLinkPreviewsState[0]}
                                        key={toot.uri}
                                        status={toot}
                                    />
                                ))}
                            </TopLevelAccordion>}

                        <div style={stickySwitchContainer}>
                            {isLoading
                                ? <LoadingSpinner message={algorithm?.loadingStatus} style={loadingMsgStyle} />
                                : finishedLoadingMsg}

                            <p style={scrollStatusMsg} className="d-none d-sm-block">
                                {TheAlgorithm.isDebugMode
                                    ? `Displaying ${numDisplayedToots} Toots (Scroll: ${scrollPercentage.toFixed(1)}%)`
                                    : <BugReportLink />}
                            </p>
                        </div>
                    </div>
                </Col>

                {/* Feed column */}
                <Col xs={12} md={6}>
                    {algorithm && !isLoading &&
                        <p style={loadNewTootsText}>
                            <a onClick={() => triggerFeedUpdate()} style={linkesque}>
                                (load new toots)
                            </a>

                           {' ● '}

                            <a onClick={() => triggerFeedUpdate(true)} style={linkesque}>
                                (load more old toots)
                            </a>
                        </p>}

                    <div style={statusesColStyle}>
                        {timeline.slice(0, numShownToots).map((toot) => (
                            <StatusComponent
                                hideLinkPreviews={hideLinkPreviewsState[0]}
                                isLoadingThread={isLoadingThread}
                                key={toot.uri}
                                setThread={setThread}
                                setIsLoadingThread={setIsLoadingThread}
                                status={toot}
                            />))}

                        {timeline.length == 0 && (
                            isLoading
                                ? <LoadingSpinner isFullPage={true} message={config.timeline.defaultLoadingMsg} />
                                : <div style={{...fullPageCenteredSpinner, fontSize: "20px"}}>
                                      <p>{config.timeline.noTootsMsg}</p>
                                  </div>
                            )}

                        <div ref={bottomRef} style={{marginTop: "10px"}} />
                    </div>
                </Col>
            </Row>
        </Container>
    );
};


const controlPanelFooter: CSSProperties = {
    height: "auto",
    paddingLeft: "2px",
    paddingRight: "2px",
};

const leftCol: CSSProperties = {
    maxHeight: "100vh",
    overflowY: "auto",
};

// TODO: move to LoadingSpinner?
export const loadingMsgStyle: CSSProperties = {
    fontSize: "16px",
    height: "auto",
    marginTop: "6px",
};

const loadNewTootsText: CSSProperties = {
    ...loadingMsgStyle,
    fontSize: "13px",
    marginTop: "8px",
    textAlign: "center",
};

const resetLinkStyle: CSSProperties = {
    color: "red",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    textDecoration: "underline",
};

const scrollStatusMsg: CSSProperties = {
    ...loadingMsgStyle,
    color: "grey",
};

const statusesColStyle: CSSProperties = {
    backgroundColor: config.theme.feedBackgroundColor,
    borderRadius: '10px',
    height: 'auto',
};

const stickySwitchContainer: CSSProperties = {
    ...controlPanelFooter,
    display: "flex",
    justifyContent: "space-between",
};

const accountTooltipStyle: CSSProperties = {
    ...tooltipZIndex,
    width: "500px",
};
