/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import React, { CSSProperties, useState, useEffect, useRef } from "react";

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { Tooltip } from 'react-tooltip';

import ExperimentalFeatures from "../components/ExperimentalFeatures";
import FilterSetter from "../components/algorithm/FilterSetter";
import LoadingSpinner, { fullPageCenteredSpinner } from "../components/LoadingSpinner";
import StatusComponent, { TOOLTIP_ACCOUNT_ANCHOR} from "../components/Status";
import TrendingInfo from "../components/TrendingInfo";
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/algorithm/WeightSetter";
import { logMsg, warnMsg } from "../helpers/string_helpers";
import { TOOLTIP_ANCHOR, linkesque } from "../helpers/style_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";

const NUM_TOOTS_TO_LOAD_ON_SCROLL = 10;
const DEFAULT_NUM_DISPLAYED_TOOTS = 20;

// Messaging constants
const AUTO_UPDATE_TOOLTIP_MSG = "If this box is checked the feed will be automatically updated when you focus this browser tab.";
const DEFAULT_LOADING_MSG = "Loading (first time can take up to a minute or so)";
const NO_TOOTS_MSG = "No toots in feed! Maybe check your filters settings?";


export default function Feed() {
    const { algorithm, isLoading, setShouldAutoUpdate, setError, shouldAutoUpdate, timeline, triggerLoad } = useAlgorithm();
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);

    // State variables
    const [hideLinkPreviews, setHideLinkPreviews] = useState(false);
    const [isControlPanelSticky, setIsControlPanelSticky] = useState<boolean>(true);  // Left panel stickiness
    const [loadingStatus, setLoadingStatus] = useState<string>(null);
    const [numDisplayedToots, setNumDisplayedToots] = useState<number>(DEFAULT_NUM_DISPLAYED_TOOTS);
    const [prevScrollY, setPrevScrollY] = useState(0);
    const [scrollPercentage, setScrollPercentage] = useState(0);

    const numShownToots = Math.max(DEFAULT_NUM_DISPLAYED_TOOTS, numDisplayedToots);

    // Reset all state except for the user and server
    const reset = async () => {
        if (!window.confirm("Are you sure?")) return;
        setError("");
        setNumDisplayedToots(DEFAULT_NUM_DISPLAYED_TOOTS);
        if (!algorithm) return;
        await algorithm.reset();
        triggerLoad();
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
                logMsg(`${msg} (${timeline.length} available in feed)`);
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
                logMsg(`Scroll percentage is less than 50%, lowering numDisplayedToots to ${newNumDisplayedToots}`);
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


    return (
        <Container fluid style={{height: 'auto'}}>
            {/* Tooltip options: https://react-tooltip.com/docs/options */}
            <Tooltip id={TOOLTIP_ANCHOR} place="top" />

            <Tooltip
                clickable={true}
                delayShow={100}
                id={TOOLTIP_ACCOUNT_ANCHOR}
                opacity={0.95}
                place="left"
                style={tooltipStyle}
                variant="light"
            />

            <Row>
                <Col xs={12} md={6}>
                    <div className="sticky-top" style={isControlPanelSticky ? {} : {position: "relative"}} >
                        <div style={stickySwitchContainer}>
                            <Form.Check
                                checked={isControlPanelSticky}
                                className="mb-3"  // bootstrap spacing info: https://getbootstrap.com/docs/5.1/utilities/spacing/
                                key={"stickPanel"}
                                label={`Stick Control Panel To Top`}
                                onChange={(e) => setIsControlPanelSticky(e.target.checked)}
                                type="checkbox"
                            />

                            <Form.Check
                                checked={hideLinkPreviews}
                                className="mb-3"
                                key={"linkPreviews"}
                                label={`Hide Link Previews`}
                                onChange={(e) => setHideLinkPreviews(e.target.checked)}
                                type="checkbox"
                            />

                            <a
                                data-tooltip-id={TOOLTIP_ANCHOR}
                                data-tooltip-content={AUTO_UPDATE_TOOLTIP_MSG}
                                key={"tooltipautoload"}
                                style={{color: "white"}}
                            >
                                <Form.Check
                                    checked={shouldAutoUpdate}
                                    className="mb-3"
                                    key={"autoLoadNewToots"}
                                    label={`Auto Load New Toots`}
                                    onChange={(e) => setShouldAutoUpdate(e.target.checked)}
                                    type="checkbox"
                                />
                            </a>
                        </div>

                        {algorithm && <WeightSetter />}
                        {algorithm && <FilterSetter />}
                        {algorithm && <TrendingInfo />}
                        {algorithm && <ExperimentalFeatures />}

                        <div style={stickySwitchContainer}>
                            {(isLoading)
                                ? <LoadingSpinner message={loadingStatus} style={loadingMsgStyle} />
                                : finishedLoadingMsg(algorithm?.lastLoadTimeInSeconds)}

                            <p style={scrollStatusMsg}>
                                {`Displaying ${numDisplayedToots} Toots (Scroll: ${scrollPercentage.toFixed(1)}%)`}
                            </p>
                        </div>
                    </div>
                </Col>

                {/* Feed column */}
                <Col xs={12} md={6}>
                    {algorithm && !isLoading &&
                        <p style={loadNewTootsText}>
                            <a onClick={() => triggerLoad()} style={linkesque}>
                                (load new toots)
                            </a>

                           {' ● '}

                            <a onClick={() => triggerLoad(true)} style={linkesque}>
                                (load more old toots)
                            </a>
                        </p>}

                    <div style={statusesColStyle}>
                        {timeline.slice(0, numShownToots).map((toot) => (
                            <StatusComponent
                                hideLinkPreviews={hideLinkPreviews}
                                key={toot.uri}
                                status={toot}
                            />
                        ))}

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


const loadingMsgStyle: CSSProperties = {
    fontSize: "16px",
    height: "20px",
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
    backgroundColor: '#15202b',
    borderRadius: '10px',
    height: 'auto',
};

const stickySwitchContainer: CSSProperties = {
    display: "flex",
    height: "20px",
    justifyContent: "space-between",
    marginBottom: "5px",
    paddingLeft: "2px",
    paddingRight: "2px",
};

const tooltipStyle: CSSProperties = {
    width: "500px",
    zIndex: 2000,
};
