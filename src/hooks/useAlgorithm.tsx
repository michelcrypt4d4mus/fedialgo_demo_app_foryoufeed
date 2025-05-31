/*
 * Context to hold the TheAlgorithm variable
 */
import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import TheAlgorithm, { GET_FEED_BUSY_MSG, Toot, isAccessTokenRevokedError } from "fedialgo";
import { createRestAPIClient, mastodon } from "masto";
import { MimeExtensions } from "../types";
import { useError } from "../components/helpers/ErrorHandler";

import { ageInSeconds } from "fedialgo/dist/helpers/time_helpers";
import { config } from "../config";
import { getLogger } from "../helpers/log_helpers";
import { Events, buildMimeExtensions } from "../helpers/string_helpers";
import { useAuthContext } from "./useAuth";
import { type ErrorHandler } from "../types";

const logger = getLogger("AlgorithmProvider");

interface AlgoContext {
    algorithm?: TheAlgorithm,
    api?: mastodon.rest.Client,
    isLoading?: boolean,
    lastLoadDurationSeconds?: number,
    mimeExtensions?: MimeExtensions,  // Map of server's allowed MIME types to file extensions
    serverInfo?: mastodon.v1.Instance | mastodon.v2.Instance,
    setShouldAutoUpdate?: (should: boolean) => void,
    shouldAutoUpdate?: boolean,
    timeline: Toot[],
    triggerFeedUpdate?: (moreOldToots?: boolean) => void,
    triggerPullAllUserData?: () => void,
};

const AlgorithmContext = createContext<AlgoContext>({timeline: []});
export const useAlgorithm = () => useContext(AlgorithmContext);


export default function AlgorithmProvider(props: PropsWithChildren) {
    const { logout, user } = useAuthContext();
    const { logAndSetFormattedError } = useError();

    // TODO: this doesn't make any API calls yet, right?
    const api: mastodon.rest.Client = createRestAPIClient({accessToken: user.access_token, url: user.server});

    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // TODO: this shouldn't start as true...
    const [lastLoadDurationSeconds, setLastLoadDurationSeconds] = useState<number | undefined>();
    const [lastLoadStartedAt, setLastLoadStartedAt] = useState<Date>(null);
    // Map of server's allowed MIME types to file extensions
    const [mimeExtensions, setMimeExtensions] = useState<MimeExtensions>({});
    // Instance info for the server
    const [serverInfo, setServerInfo] = useState<mastodon.v1.Instance | mastodon.v2.Instance>(null);
    // User checkbox to load new toots on refocus
    const [shouldAutoUpdate, setShouldAutoUpdate] = useState<boolean>(false);
    const [timeline, setTimeline] = useState<Toot[]>([]);

    // TODO: somehow this consistently gets called to setIsLoading(false) but the react component's state
    // has somehow already been updated to isLoading=false, so it logs a warning.
    const setLoadState = (newIsLoading: boolean) => {
        const msg = `setLoadState() called (isLoading: "${isLoading}", newIsLoading: "${newIsLoading}")`;
        (isLoading === newIsLoading) ? logger.warn(msg) : logger.trace(msg);

        if (newIsLoading) {
            const startedAt = new Date();
            logger.trace(`Marking load as started at ${startedAt.toISOString()}`);
            setLastLoadStartedAt(startedAt);
        } else  {
            if (!lastLoadStartedAt) {
                logger.error(`setLoadState() called with isLoading false but lastLoadStartedAt is null!`);
            } else {
                const lastLoadDuration = ageInSeconds(lastLoadStartedAt).toFixed(1);
                logger.log(`Load finished in ${lastLoadDuration} seconds`);
                setLastLoadDurationSeconds(Number(lastLoadDuration));
            }
        }

        setIsLoading(newIsLoading);
    };

    const handleError: ErrorHandler = (msg: string, errorObj?: Error) => {
        logAndSetFormattedError({
            errorObj,
            logger,
            msg,
            args: { api, lastLoadStartedAt, lastLoadDurationSeconds, serverInfo, user }
        });
    };

    const trigger = (loadFxn: () => Promise<void>) => triggerLoadFxn(loadFxn, handleError, setLoadState);
    const triggerFeedUpdate = (moreOldToots?: boolean) => trigger(() => algorithm.triggerFeedUpdate(moreOldToots));
    const triggerPullAllUserData = () => trigger(() => algorithm.triggerPullAllUserData());

    // Initial load of the feed
    useEffect(() => {
        if (!user) {
            logger.warn(`constructFeed() useEffect called without user, skipping initial load`);
            return;
        }

        // Check that we have valid user credentials and load timeline toots, otherwise force a logout.
        const constructFeed = async (): Promise<void> => {
            logger.log(`constructFeed() called with user ID ${user?.id} (feed already has ${timeline.length} toots)`);
            let currentUser: mastodon.v1.Account;

            try {
                currentUser = await api.v1.accounts.verifyCredentials();
            } catch (err) {
                if (isAccessTokenRevokedError(err)) {
                    handleError(config.app.accessTokenRevokedMsg, err);
                } else {
                    handleError(`Failed to verifyCredentials(), logging out...`, err);
                }

                // TODO: we don't always actually logout here? Sometimes it just keeps working despite getting the error in logs
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
            triggerLoadFxn(() => algo.triggerFeedUpdate(), handleError, setLoadState);

            algo.serverInfo()
                .then(info => {
                    setServerInfo(info);
                    setMimeExtensions(buildMimeExtensions(info.configuration.mediaAttachments.supportedMimeTypes));
                })
                .catch(err => {
                    // Not serious enough error to alert the user as we can fallback to our configured defaults
                    logger.warn(`Failed to get server info:`, err);
                });
        };

        constructFeed();
    }, [setAlgorithm, user]);

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
    }, [algorithm, isLoading, timeline, triggerFeedUpdate, user]);

    const algoContext: AlgoContext = {
        algorithm,
        api,
        isLoading,
        lastLoadDurationSeconds,
        mimeExtensions,
        serverInfo,
        setShouldAutoUpdate,
        shouldAutoUpdate,
        timeline,
        triggerFeedUpdate,
        triggerPullAllUserData
    };

    return (
        <AlgorithmContext.Provider value={algoContext}>
            {props.children}
        </AlgorithmContext.Provider>
    );
};


// Wrapper for calls to FediAlgo TheAlgorithm class that can throw a "busy" error
const triggerLoadFxn = (
    loadFxn: () => Promise<void>,
    handleError: ErrorHandler,
    setLoadState: (isLoading: boolean) => void,
) => {
    setLoadState(true);

    loadFxn()
        .then(() => {
            logger.log(`triggerLoadFxn finished`);
            setLoadState(false);
        })
        .catch((err) => {
            if (err.message.includes(GET_FEED_BUSY_MSG)) {
                // Don't flip the isLoading state if the feed is busy
                handleError(config.timeline.loadingErroMsg);
            } else {
                handleError(`Failure while retrieving timeline data!`, err);
                setLoadState(false);
            }
        });
};
