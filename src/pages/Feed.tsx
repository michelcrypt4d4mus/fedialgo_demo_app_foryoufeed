/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import React, { CSSProperties, useState, useEffect, useRef } from "react";
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

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
import { ComponentLogger } from "../helpers/log_helpers";
import { confirm } from "../components/helpers/Confirmation";
import { FEED_BACKGROUND_COLOR, TOOLTIP_ANCHOR, linkesque, tooltipZIndex } from "../helpers/style_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";
import { useError } from "../components/helpers/ErrorHandler";

const NUM_TOOTS_TO_LOAD_ON_SCROLL = 10;
const DEFAULT_NUM_DISPLAYED_TOOTS = 20;

// Messaging constants
const AUTO_UPDATE_TOOLTIP_MSG = "If this box is checked the feed will be automatically updated when you focus this browser tab.";
const DEFAULT_LOADING_MSG = "Loading (first time can take up to a minute or so)";
const NO_TOOTS_MSG = "No toots in feed! Maybe check your filters settings?";

const logger = new ComponentLogger("Feed");


export default function Feed() {
    const { algorithm, isLoading, setShouldAutoUpdate, shouldAutoUpdate, timeline, triggerFeedUpdate } = useAlgorithm();
    const { setError } = useError();

    // State variables
    const hideLinkPreviewsState = useState(false);
    const isControlPanelStickyState = useState(true);  // Left panel stickiness
    const [isLoadingThread, setIsLoadingThread] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState<string>(null);
    const [numDisplayedToots, setNumDisplayedToots] = useState<number>(DEFAULT_NUM_DISPLAYED_TOOTS);
    const [prevScrollY, setPrevScrollY] = useState(0);
    const [scrollPercentage, setScrollPercentage] = useState(0);
    const [thread, setThread] = useState<Toot[]>([]);

    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);
    const numShownToots = Math.max(DEFAULT_NUM_DISPLAYED_TOOTS, numDisplayedToots);
    const leftColStyle: CSSProperties = isControlPanelStickyState[0] ? {} : {position: "relative"};

    // Reset all state except for the user and server
    const reset = async () => {
        if (!(await confirm(`Are you sure you want to clear all historical data?`))) return;
        setError("");
        setNumDisplayedToots(DEFAULT_NUM_DISPLAYED_TOOTS);
        if (!algorithm) return;
        await algorithm.reset();
        triggerFeedUpdate();
    };

    const finishedLoadingMsg = (lastLoadTimeInSeconds: number | null) => {
        let msg = `Scored ${(timeline?.length || 0).toLocaleString()} toots`;
        if (lastLoadTimeInSeconds) msg += ` in ${lastLoadTimeInSeconds.toFixed(1)} seconds`;

        return (
            <p style={loadingMsgStyle}>
                {msg} ({<a onClick={reset} style={resetLinkStyle}>clear all data and reload</a>})
            </p>
        );
    };

    // Show more toots when the user scrolls to bottom of the page
    // TODO: this triggers twice: once when isbottom changes to true and again because numDisplayedToots
    //       is increased, triggerng a second evaluation of the block
    useEffect(() => {
        // Pull more toots to display from our local cached and sorted toot feed
        // TODO: this should trigger the pulling of more toots from the server if we run out of local cache
        const showMoreToots = () => {
            if (numDisplayedToots < timeline.length) {
                const msg = `Showing ${numDisplayedToots} toots, adding ${NUM_TOOTS_TO_LOAD_ON_SCROLL} more`;
                logger.log(`${msg} (${timeline.length} available in feed)`);
                setNumDisplayedToots(numDisplayedToots + NUM_TOOTS_TO_LOAD_ON_SCROLL);
            }
        };

        // If the user scrolls to the bottom of the page, show more toots
        if (isBottom && timeline.length) showMoreToots();
        // If there's less than numDisplayedToots in the feed set numDisplayedToots to the number of toots in the feed
        if (timeline?.length && timeline.length < numDisplayedToots) setNumDisplayedToots(timeline.length);

        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight; // Total height
            const scrollPosition = document.documentElement.scrollTop || window.scrollY; // Current scroll position
            const viewportHeight = document.documentElement.clientHeight; // Visible viewport height
            const totalScrollableHeight = scrollHeight - viewportHeight; // Scrollable distance
            const percentage = (scrollPosition / totalScrollableHeight) * 100;
            setScrollPercentage(percentage);

            if (percentage <= 50 && numDisplayedToots > (DEFAULT_NUM_DISPLAYED_TOOTS * 2)) {
                const newNumDisplayedToots = Math.floor(numDisplayedToots * 0.7);
                logger.log(`Scroll percentage is less than 50%, lowering numDisplayedToots to ${newNumDisplayedToots}`);
                setNumDisplayedToots(newNumDisplayedToots);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isBottom, numDisplayedToots, prevScrollY, setNumDisplayedToots, setPrevScrollY, timeline]);

    // Watch the algorithm.loadingStatus for changes because the renderer doesn't pick them up on its own (TODO: why?)
    // TODO: this doesn't actually work, the "Finalizing Score" loadingStatus doesn't show up usually
    useEffect(() => {
        if (!algorithm) return;
        setLoadingStatus(algorithm.loadingStatus);
    }, [algorithm, algorithm?.loadingStatus, isLoading]);


    const buildStateCheckbox = (label: string, state: ReturnType<typeof useState<boolean>>, className?: string) => (
        <Form.Check
            checked={state[0]}
            className={className || ''}
            key={label}
            label={label}
            onChange={(e) => state[1](e.target.checked)}
            type="checkbox"
        />
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
                                data-tooltip-content={AUTO_UPDATE_TOOLTIP_MSG}
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
                                ? <LoadingSpinner message={loadingStatus} style={loadingMsgStyle} />
                                : finishedLoadingMsg(algorithm?.lastLoadTimeInSeconds)}

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
                                ? <LoadingSpinner isFullPage={true} message={DEFAULT_LOADING_MSG} />
                                : <div style={{...fullPageCenteredSpinner, fontSize: "20px"}}>
                                      <p>{NO_TOOTS_MSG}</p>
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

const loadingMsgStyle: CSSProperties = {
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
    backgroundColor: FEED_BACKGROUND_COLOR,
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
