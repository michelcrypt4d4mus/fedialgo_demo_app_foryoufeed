/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import React, { Button, Col, Container, Row } from 'react-bootstrap';
import { CSSProperties, useEffect, useRef, useState } from "react";

import TheAlgorithm, { Toot, optionalSuffix } from "fedialgo";
import { Tooltip } from 'react-tooltip';

import BugReportLink from "../components/helpers/BugReportLink";
import ExperimentalFeatures from "../components/experimental/ExperimentalFeatures";
import FilterSetter from "../components/algorithm/FilterSetter";
import LoadingSpinner, { fullPageCenteredSpinner } from "../components/helpers/LoadingSpinner";
import persistentCheckbox from '../components/helpers/persistent_checkbox';
import ReplyModal from '../components/status/ReplyModal';
import StatusComponent, { TOOLTIP_ACCOUNT_ANCHOR} from "../components/status/Status";
import TopLevelAccordion from "../components/helpers/TopLevelAccordion";
import TooltippedLink from '../components/helpers/TooltippedLink';
import TrendingInfo from "../components/TrendingInfo";
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/algorithm/WeightSetter";
import { config } from "../config";
import { confirm } from "../components/helpers/Confirmation";
import { getLogger } from "../helpers/log_helpers";
import { linkesque, rawErrorContainer, tooltipZIndex } from "../helpers/style_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";

const logger = getLogger("Feed");


export default function Feed() {
    const {
        algorithm,
        allowMultiSelectCheckbox,
        hideSensitiveCheckbox,
        isLoading,
        lastLoadDurationSeconds,
        resetAlgorithm,
        showFilterHighlightsCheckbox,
        shouldAutoUpdateCheckbox,
        timeline,
        triggerFeedUpdate,
        triggerHomeTimelineBackFill,
        triggerMoarData
    } = useAlgorithm();

    // State variables
    const [isLoadingThread, setIsLoadingThread] = useState(false);
    const [numDisplayedToots, setNumDisplayedToots] = useState<number>(config.timeline.defaultNumDisplayedToots);
    const [prevScrollY, setPrevScrollY] = useState(0);
    const [showNewTootModal, setShowNewTootModal] = useState(false);
    const [scrollPercentage, setScrollPercentage] = useState(0);
    const [thread, setThread] = useState<Toot[]>([]);

    // Checkboxes for persistent user settings state variables
    // TODO: the returned checkboxTooltip is shared by all tooltips which kind of sucks
    const [showLinkPreviews, showLinkPreviewsCheckbox, checkboxTooltip] = persistentCheckbox({
        isChecked: true,
        labelAndTooltip: config.timeline.guiCheckboxLabels.showLinkPreviews,
    });

    const [isControlPanelSticky, isControlPanelStickyCheckbox] = persistentCheckbox({
        className: 'd-none d-sm-block',
        isChecked: true,
        labelAndTooltip: config.timeline.guiCheckboxLabels.stickToTop,
    });

    // Computed variables etc.
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);
    const leftColStyle: CSSProperties = isControlPanelSticky ? {} : {position: "relative"};
    const numShownToots = Math.max(config.timeline.defaultNumDisplayedToots, numDisplayedToots);

    // Reset all state except for the user and server
    const reset = async () => {
        if (!(await confirm(`Are you sure you want to clear all historical data?`))) return;
        setNumDisplayedToots(config.timeline.defaultNumDisplayedToots);
        resetAlgorithm();
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
    footerMsg += optionalSuffix(lastLoadDurationSeconds, seconds => `in ${seconds.toFixed(1)} seconds`);

    return (
        <Container fluid style={{height: "auto"}}>
            <ReplyModal setShow={setShowNewTootModal} show={showNewTootModal}/>

            <Row style={{cursor: isLoadingThread ? 'wait' : 'default'}}>
                {/* Tooltip options: https://react-tooltip.com/docs/options */}
                <Tooltip
                    border={"solid"}
                    clickable={true}
                    delayShow={config.timeline.tooltips.accountTooltipDelayMS}
                    id={TOOLTIP_ACCOUNT_ANCHOR}
                    opacity={0.95}
                    place="left"
                    style={accountTooltipStyle}
                    variant="light"
                />

                {checkboxTooltip}

                <Col md={6} xs={12} >
                    {/* TODO: maybe the inset-inline-end property could be used to allow panel to scroll to length but still stick? */}
                    <div className="sticky-top left-col-scroll" style={leftColStyle}>
                        <div style={stickySwitchContainer}>
                            {isControlPanelStickyCheckbox}
                            {showLinkPreviewsCheckbox}
                            {allowMultiSelectCheckbox}
                            {showFilterHighlightsCheckbox}
                            {hideSensitiveCheckbox}
                            {shouldAutoUpdateCheckbox}
                        </div>

                        {algorithm && <WeightSetter />}
                        {algorithm && <FilterSetter />}
                        {algorithm && <TrendingInfo />}
                        {algorithm && <ExperimentalFeatures />}

                        {(thread.length > 0) &&
                            <TopLevelAccordion onExited={() => setThread([])} startOpen={true} title="Thread">
                                {thread.map((toot) => (
                                    <StatusComponent
                                        fontColor="black"
                                        key={toot.uri}
                                        showLinkPreviews={showLinkPreviews}
                                        status={toot}
                                    />
                                ))}
                            </TopLevelAccordion>}

                        <div style={stickySwitchContainer}>
                            {isLoading
                                ? <LoadingSpinner message={algorithm?.loadingStatus} style={loadingMsgStyle} />
                                : <p style={loadingMsgStyle}>
                                      {footerMsg} (
                                          {<a onClick={reset} style={resetLinkStyle}>clear all data and reload</a>}
                                      )
                                  </p>}

                            <p style={scrollStatusMsg} className="d-none d-sm-block">
                                {TheAlgorithm.isDebugMode
                                    ? `Displaying ${numDisplayedToots} Toots (Scroll: ${scrollPercentage.toFixed(1)}%)`
                                    : <BugReportLink />}
                            </p>
                        </div>

                        <div className="d-grid gap-2" style={newTootButton}>
                            <Button
                                className='p-2 text-center'
                                onClick={() => setShowNewTootModal(true)}
                                variant="outline-secondary"
                            >
                                {`Create New Toot`}
                            </Button>
                        </div>

                        {algorithm?.apiErrorMsgs && (algorithm.apiErrorMsgs.length > 0) &&
                            <div className="d-grid gap-2" style={rawErrorContainer}>
                                <p style={{color: "white"}}>Non-fatal errors encountered while loading data:</p>

                                <ul>
                                    {algorithm.apiErrorMsgs.map((msg, i) => (
                                        <li key={`${msg}_${i}`} style={errorItem}>
                                            {msg}
                                        </li>
                                    ))}
                                </ul>
                            </div>}
                    </div>
                </Col>

                {/* Feed column */}
                <Col xs={12} md={6}>
                    {algorithm && !isLoading &&
                        <div style={loadNewTootsText}>
                            <a onClick={triggerFeedUpdate} style={linkesque}>
                                (load new toots)
                            </a>

                           {' ● '}

                            <TooltippedLink
                                label={"(load old toots)"}
                                onClick={triggerHomeTimelineBackFill}
                                labelStyle={linkesque}
                                tooltipText={"Load more toots but starting from the oldest toot in your feed and working backwards"}
                            />

                           {' ● '}

                            <TooltippedLink
                                label={"(load more algorithm data)"}
                                onClick={triggerMoarData}
                                labelStyle={linkesque}
                                tooltipText={"Use more of your Mastodon activity to refine the algorithm"}
                            />
                        </div>}

                    <div style={statusesColStyle}>
                        {timeline.slice(0, numShownToots).map((toot) => (
                            <StatusComponent
                                isLoadingThread={isLoadingThread}
                                key={toot.uri}
                                setThread={setThread}
                                setIsLoadingThread={setIsLoadingThread}
                                showLinkPreviews={showLinkPreviews}
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


const accountTooltipStyle: CSSProperties = {
    ...tooltipZIndex,
    width: "500px",
};

const errorItem: CSSProperties = {
    color: "#9e0d12",
    marginTop: "10px",
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
    display: "flex",
    justifyContent: "space-between",
    height: "auto",
    paddingLeft: "2px",
    paddingRight: "2px",
};

const newTootButton: CSSProperties = {
    // justifyContent: "space-between",
    marginTop: "35px",
    marginLeft: "200px",
    marginRight: "200px",
};
