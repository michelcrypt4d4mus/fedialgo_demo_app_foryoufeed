/*
 * Context to hold the TheAlgorithm variable
 */
import { PropsWithChildren, ReactElement, createContext, useContext, useEffect, useState } from "react";

import TheAlgorithm, { GET_FEED_BUSY_MSG, Toot, isAccessTokenRevokedError } from "fedialgo";
import { createRestAPIClient, mastodon } from "masto";
import { useError } from "../components/helpers/ErrorHandler";

import persistentCheckbox from "../components/helpers/persistent_checkbox";
import { addMimeExtensionsToServer, type MastodonServer } from "../helpers/mastodon_helpers";
import { ageInSeconds } from "fedialgo/dist/helpers/time_helpers";
import { config } from "../config";
import { getLogger } from "../helpers/log_helpers";
import { Events } from "../helpers/string_helpers";
import { useAuthContext } from "./useAuth";
import { type ErrorHandler } from "../types";

const logger = getLogger("AlgorithmProvider");
const loadLogger = logger.tempLogger("setLoadState");

interface AlgoContext {
    algorithm?: TheAlgorithm,
    api?: mastodon.rest.Client,
    isLoading?: boolean,
    hideFilterHighlights?: boolean,
    hideFilterHighlightsCheckbox?: ReactElement,
    lastLoadDurationSeconds?: number,
    resetAlgorithm?: () => Promise<void>,
    serverInfo?: MastodonServer,
    shouldAutoUpdateCheckbox?: ReactElement,
    timeline: Toot[],
    triggerFeedUpdate?: (moreOldToots?: boolean) => void,
    triggerMoarData?: () => void,
    triggerPullAllUserData?: () => void,
};

const AlgorithmContext = createContext<AlgoContext>({timeline: []});
export const useAlgorithm = () => useContext(AlgorithmContext);


export default function AlgorithmProvider(props: PropsWithChildren) {
    const { logout, user } = useAuthContext();
    const { logAndSetFormattedError, resetErrors } = useError();

    // State variables
    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // TODO: this shouldn't start as true...
    const [lastLoadDurationSeconds, setLastLoadDurationSeconds] = useState<number | undefined>();
    const [lastLoadStartedAt, setLastLoadStartedAt] = useState<Date>(new Date());
    const [serverInfo, setServerInfo] = useState<MastodonServer>(null);   // Instance info for the user's server
    const [timeline, setTimeline] = useState<Toot[]>([]);

    // TODO: this doesn't make any API calls yet, right?
    const api = createRestAPIClient({accessToken: user.access_token, url: user.server});

    // Checkboxes with persistent storage that require somewhat global state
    const [hideFilterHighlights, hideFilterHighlightsCheckbox, _tooltip] = persistentCheckbox({
        labelAndTooltip: config.timeline.guiCheckboxLabels.hideFilterHighlights,
    });

    const [shouldAutoUpdate, shouldAutoUpdateCheckbox, _tooltip2] = persistentCheckbox({
        labelAndTooltip: config.timeline.guiCheckboxLabels.autoupdate,
    });

    // Pass startedLoadAt as an arg every time because managing the react state of the last load is tricky
    const setLoadState = (newIsLoading: boolean, startedLoadAt: Date) => {
        const loadStartedAtStr = startedLoadAt.toISOString();
        const msg = `called (isLoading: "${isLoading}", newIsLoading: "${newIsLoading}", loadStartedAt: "${loadStartedAtStr}")`;
        (isLoading === newIsLoading) ? loadLogger.warn(msg) : loadLogger.trace(msg);
        setIsLoading(newIsLoading);

        if (newIsLoading) {
            setLastLoadStartedAt(startedLoadAt);
        } else {
            const lastLoadDuration = ageInSeconds(startedLoadAt).toFixed(1);
            loadLogger.log(`Load finished in ${lastLoadDuration} seconds (lastLoadStartedAt: "${loadStartedAtStr}")`);
            setLastLoadDurationSeconds(Number(lastLoadDuration));
        }
    };

    // Log a bunch of info about the current state along with the msg
    const logAndShowError: ErrorHandler = (msg: string, errorObj?: Error) => {
        const args = { api, lastLoadStartedAt, lastLoadDurationSeconds, serverInfo, user };
        logAndSetFormattedError({ args, errorObj, logger, msg });
    };

    // Wrapper for calls to FediAlgo TheAlgorithm class that can throw a "busy" error
    const triggerLoadFxn = (
        loadFxn: () => Promise<void>,
        handleError: ErrorHandler,
        setLoadState: (isLoading: boolean, startedLoadAt: Date) => void,
    ) => {
        const startedAt = new Date();
        setLoadState(true, startedAt);

        loadFxn()
            .then(() => {
                loadLogger.log(`triggerLoadFxn finished`);
                setLoadState(false, startedAt);
            })
            .catch((err) => {
                // Don't flip the isLoading state if the feed is just busy loading
                if (err.message.includes(GET_FEED_BUSY_MSG)) {
                    handleError(config.timeline.loadingErroMsg);
                } else {
                    handleError(`Failure while retrieving timeline data!`, err);
                    setLoadState(false, startedAt);
                }
            });
    };

    const trigger = (loadFxn: () => Promise<void>) => triggerLoadFxn(loadFxn, logAndShowError, setLoadState);
    const triggerFeedUpdate = (moreOldToots?: boolean) => trigger(() => algorithm.triggerFeedUpdate(moreOldToots));
    const triggerMoarData = () => trigger(() => algorithm.triggerMoarData());
    const triggerPullAllUserData = () => trigger(() => algorithm.triggerPullAllUserData());

    // Reset all state except for the user and server
    const resetAlgorithm = async () => {
        resetErrors();
        if (!algorithm) return;
        setIsLoading(true);
        await algorithm.reset();
        triggerFeedUpdate();
    };

    // Initial load of the feed
    useEffect(() => {
        if (!user || algorithm) return;

        // Check that we have valid user credentials and load timeline toots, otherwise force a logout.
        const constructFeed = async (): Promise<void> => {
            logger.log(`constructFeed() called with user ID ${user?.id} (feed already has ${timeline.length} toots)`);
            let currentUser: mastodon.v1.Account;

            try {
                currentUser = await api.v1.accounts.verifyCredentials();
            } catch (err) {
                // TODO: are these kind of errors actually recoverable?
                if (err.message.includes("NetworkError when attempting to fetch resource")) {
                    logger.error(`NetworkError during verifyCredentials() but not going to log out`, err);
                    return;
                } else if (isAccessTokenRevokedError(err)) {
                    logAndShowError(config.app.accessTokenRevokedMsg, err);
                } else {
                    logAndShowError(`Failed to verifyCredentials(), logging out...`, err);
                }

                logout(true);
                return;
            }

            const algo = await TheAlgorithm.create({
                api: api,
                user: currentUser,
                setTimelineInApp: setTimeline,
                locale: navigator?.language
            });

            setAlgorithm(algo);
            triggerLoadFxn(() => algo.triggerFeedUpdate(), logAndShowError, setLoadState);

            algo.serverInfo()
                .then(serverInfo => {
                    logger.trace(`User's server info retrieved for "${serverInfo.domain}":`, serverInfo);
                    setServerInfo(addMimeExtensionsToServer(serverInfo));
                })
                .catch(err => {
                    // Not serious enough error to alert the user as we can fallback to our configured defaults
                    logger.error(`Failed to get server info:`, err);
                });
        };

        constructFeed();
    }, [algorithm, setLastLoadDurationSeconds, setLoadState, user]);

    // Set up feed reloader to call algorithm.triggerFeedUpdate() on focus after configured amount of time
    useEffect(() => {
        if (!user || !algorithm) return;

        const shouldReloadFeed = (): boolean => {
            if (!shouldAutoUpdate) return false;
            let should = false;
            let msg: string;

            if (isLoading || algorithm.isLoading()) {
                msg = `load in progress`;
                if (!isLoading) logger.error(`isLoading is true but ${msg}`);
            } else {
                const feedAgeInSeconds = algorithm.mostRecentHomeTootAgeInSeconds();

                if (feedAgeInSeconds) {
                    msg = `feed is ${feedAgeInSeconds.toFixed(0)}s old`;
                    should = feedAgeInSeconds > config.timeline.autoloadOnFocusAfterMinutes * 60;
                } else {
                    msg = `${timeline.length} toots in feed but no most recent toot found!`;
                    logger.error(msg);
                }
            }

            logger.log(`shouldReloadFeed() returning ${should} (${msg})`);
            return should;
        };

        const handleFocus = () => document.hasFocus() && shouldReloadFeed() && triggerFeedUpdate();
        window.addEventListener(Events.FOCUS, handleFocus);
        return () => window.removeEventListener(Events.FOCUS, handleFocus);
    }, [algorithm, isLoading, shouldAutoUpdate, timeline, triggerFeedUpdate, user]);

    const algoContext: AlgoContext = {
        algorithm,
        api,
        hideFilterHighlights,
        hideFilterHighlightsCheckbox,
        isLoading,
        lastLoadDurationSeconds,
        resetAlgorithm,
        serverInfo,
        shouldAutoUpdateCheckbox,
        timeline,
        triggerFeedUpdate,
        triggerMoarData,
        triggerPullAllUserData
    };

    return (
        <AlgorithmContext.Provider value={algoContext}>
            {props.children}
        </AlgorithmContext.Provider>
    );
};
