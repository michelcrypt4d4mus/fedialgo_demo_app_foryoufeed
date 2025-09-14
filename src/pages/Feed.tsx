/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import React, { CSSProperties, useEffect, useRef, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";

import TheAlgorithm, { Toot, optionalSuffix } from "fedialgo";
import { Tooltip } from "react-tooltip";

import ApiErrorsPanel from "../components/ApiErrorsPanel";
import BugReportLink from "../components/helpers/BugReportLink";
import ExperimentalFeatures from "../components/experimental/ExperimentalFeatures";
import FeedFiltersAccordionSection from "../components/algorithm/FeedFiltersAccordionSection";
import LoadingSpinner, { fullPageCenteredSpinner } from "../components/helpers/LoadingSpinner";
import persistentCheckbox from "../components/helpers/persistent_checkbox";
import ReplyModal from "../components/status/ReplyModal";
import StatusComponent, { TOOLTIP_ACCOUNT_ANCHOR} from "../components/status/Status";
import TooltippedLink from "../components/helpers/TooltippedLink";
import TopLevelAccordion from "../components/helpers/TopLevelAccordion";
import TrendingInfo from "../components/TrendingInfo";
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/algorithm/WeightSetter";
import { booleanIcon } from "../helpers/react_helpers";
import { config } from "../config";
import { confirm } from "../components/helpers/Confirmation";
import { getLogger } from "../helpers/log_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";
import {
    boldFont,
    linkesque,
    loadingMsgStyle,
    mildlyRoundedCorners,
    monoFont,
    roundedCorners,
    stickySwitchContainer,
    TEXT_CENTER_P2,
    tooltipZIndex,
    verticalContainer,
    waitOrDefaultCursor,
} from "../helpers/style_helpers";

const LOAD_BUTTON_SEPARATOR = ' ● ';
const logger = getLogger("Feed");


export default function Feed() {
    const {
        algorithm,
        hideSensitiveCheckbox,
        isLoading,
        lastLoadDurationSeconds,
        resetAlgorithm,
        shouldAutoUpdateCheckbox,
        timeline,
        triggerFeedUpdate,
        triggerHomeTimelineBackFill,
        triggerMoarData,
    } = useAlgorithm();

    // State variables
    const [isLoadingThread, setIsLoadingThread] = useState(false);
    const [numDisplayedToots, setNumDisplayedToots] = useState<number>(config.timeline.defaultNumDisplayedToots);
    const [prevScrollY, setPrevScrollY] = useState(0);
    const [scrollPercentage, setScrollPercentage] = useState(0);
    const [showNewTootModal, setShowNewTootModal] = useState(false);
    const [thread, setThread] = useState<Toot[]>([]);

    // Checkboxes for persistent user settings state variables
    // TODO: the returned checkboxTooltip is shared by all tooltips which kind of sucks
    // TODO: kind of sucks that these checkboxes are instantiated here and the others are in useAlgorithm
    const [showLinkPreviews, showLinkPreviewsCheckbox, checkboxTooltip] = persistentCheckbox({
        labelAndTooltip: config.timeline.guiCheckboxLabels.showLinkPreviews,
    });

    const [isControlPanelSticky, isControlPanelStickyCheckbox] = persistentCheckbox({
        className: 'd-none d-sm-block',
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

            <Row style={waitOrDefaultCursor(isLoadingThread)}>
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
                            {hideSensitiveCheckbox}
                            {shouldAutoUpdateCheckbox}
                        </div>

                        {algorithm && <WeightSetter />}
                        {algorithm && <FeedFiltersAccordionSection />}
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
                                className={TEXT_CENTER_P2}
                                onClick={() => setShowNewTootModal(true)}
                                variant="outline-secondary"
                            >
                                {`Create New Toot`}
                            </Button>
                        </div>

                        {algorithm && <ApiErrorsPanel />}

                        {TheAlgorithm.isDebugMode &&
                            <div style={envVarDebugPanel}>
                                <ul>
                                    <li><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</li>
                                    <li><strong>Debug Mode:</strong> {booleanIcon(TheAlgorithm.isDebugMode)}</li>
                                    <li><strong>Deep Debug:</strong> {booleanIcon(TheAlgorithm.isDeepDebug)}</li>
                                    <li><strong>Load Test:</strong> {booleanIcon(TheAlgorithm.isLoadTest)}</li>
                                    <li><strong>Quick Mode:</strong> {booleanIcon(TheAlgorithm.isQuickMode)}</li>
                                </ul>
                            </div>}
                    </div>
                </Col>

                {/* Feed column */}
                <Col xs={12} md={6}>
                    {algorithm && !isLoading &&
                        <div style={loadNewTootsText}>
                            <TooltippedLink
                                labelAndTooltip={config.timeline.loadTootsButtonLabels.loadNewToots}
                                onClick={triggerFeedUpdate}
                            />

                           {LOAD_BUTTON_SEPARATOR}

                            <TooltippedLink
                                labelAndTooltip={config.timeline.loadTootsButtonLabels.loadOldToots}
                                onClick={triggerHomeTimelineBackFill}
                            />

                           {LOAD_BUTTON_SEPARATOR}

                            <TooltippedLink
                                labelAndTooltip={config.timeline.loadTootsButtonLabels.loadUserDataForAlgorithm}
                                onClick={triggerMoarData}
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
                                : <div style={noTootsMsgStyle}><p>{config.timeline.noTootsMsg}</p></div>
                            )}

                        <div ref={bottomRef} style={bottomRefSpacer} />
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

const bottomRefSpacer: CSSProperties = {
    marginTop: "10px",
};

const envVarDebugPanel: CSSProperties = {
    ...monoFont,
    ...roundedCorners,
    color: "white",
    fontSize: 16,
    marginTop: "28px",
    paddingLeft: "60px",
};

const loadNewTootsText: CSSProperties = {
    ...loadingMsgStyle,
    fontSize: 13,
    marginTop: "8px",
    textAlign: "center",
};

const newTootButton: CSSProperties = {
    ...verticalContainer,
    marginTop: "35px",
    marginLeft: "200px",
    marginRight: "200px",
};

const noTootsMsgStyle: CSSProperties = {
    ...fullPageCenteredSpinner,
    fontSize: 20,
};

const resetLinkStyle: CSSProperties = {
    ...boldFont,
    ...linkesque,
    color: "red",
    fontSize: 14,
};

const scrollStatusMsg: CSSProperties = {
    ...loadingMsgStyle,
    color: "grey",
};

const statusesColStyle: CSSProperties = {
    ...mildlyRoundedCorners,
    backgroundColor: config.theme.feedBackgroundColor,
    height: 'auto',
};
