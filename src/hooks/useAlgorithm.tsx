/*
 * Context to hold the TheAlgorithm variable
 */
import React, { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import TheAlgorithm, { GET_FEED_BUSY_MSG, Toot, isAccessTokenRevokedError } from "fedialgo";
import { createRestAPIClient, mastodon } from "masto";
import { MimeExtensions } from "../types";
import { useError } from "../components/helpers/ErrorHandler";

import { ComponentLogger, logger.error, logger.log, logger.error } from "../helpers/log_helpers";
import { LOADING_ERROR_MSG, buildMimeExtensions } from "../helpers/string_helpers";
import { useAuthContext } from "./useAuth";

const FOCUS = "focus";
const RELOAD_IF_OLDER_THAN_MINUTES = 5;
const RELOAD_IF_OLDER_THAN_SECONDS = 60 * RELOAD_IF_OLDER_THAN_MINUTES;
const logger = new ComponentLogger("AlgorithmProvider");

interface AlgoContext {
    algorithm?: TheAlgorithm,
    api?: mastodon.rest.Client,
    serverInfo?: mastodon.v1.Instance | mastodon.v2.Instance,
    isLoading?: boolean,
    mimeExtensions?: MimeExtensions,  // Map of server's allowed MIME types to file extensions
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
    const { setError } = useError();

    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mimeExtensions, setMimeExtensions] = useState<MimeExtensions>({});  // Map of server's allowed MIME types to file extensions
    const [serverInfo, setServerInfo] = useState<mastodon.v1.Instance | mastodon.v2.Instance>(null);  // Instance info for the server
    const [shouldAutoUpdate, setShouldAutoUpdate] = useState<boolean>(false);  // Load new toots on refocus
    const [timeline, setTimeline] = useState<Toot[]>([]);  // contains timeline Toots

    // TODO: this doesn't make any API calls yet, right?
    const api: mastodon.rest.Client = createRestAPIClient({accessToken: user.access_token, url: user.server});
    const trigger = (loadFxn: () => Promise<void>) => {triggerLoadFxn(loadFxn, setError, setIsLoading);};
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
                    logger.error(`Access token has been revoked, logging out...`);
                } else {
                    logger.error(`Logging out, failed to verifyCredentials() with error:`, err);
                }

                // TODO: we don't always actually logout here? Sometimes it just keeps working despite getting the error in logs
                logout();
                return;
            }

            const algo = await TheAlgorithm.create({
                api: api,
                user: currentUser,
                setTimelineInApp: setTimeline,
                locale: navigator?.language
            });

            setAlgorithm(algo);
            triggerLoadFxn(() => algo.triggerFeedUpdate(), setError, setIsLoading);

            algo.serverInfo().then(info => {
                setServerInfo(info);
                setMimeExtensions(buildMimeExtensions(info.configuration.mediaAttachments.supportedMimeTypes));
            });
        };

        constructFeed();
    }, [setAlgorithm, user]);

    // Set up feed reloader to call algorithm.triggerFeedUpdate() on focus after RELOAD_IF_OLDER_THAN_SECONDS
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
                    should = feedAgeInSeconds > RELOAD_IF_OLDER_THAN_SECONDS;
                } else {
                    msg = `${timeline.length} toots in feed but no most recent toot found!`;
                    logger.error(msg);
                }
            }

            logger.log(`shouldReloadFeed() returning ${should} (${msg})`);
            return should;
        };

        const handleFocus = () => document.hasFocus() && shouldReloadFeed() && triggerFeedUpdate();
        window.addEventListener(FOCUS, handleFocus);
        return () => window.removeEventListener(FOCUS, handleFocus);
    }, [algorithm, isLoading, timeline, triggerFeedUpdate, user]);

    const algoContext: AlgoContext = {
        algorithm,
        api,
        isLoading,
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
    setError: (error: string) => void,
    setIsLoading: (isLoading: boolean) => void,
) => {
    setIsLoading(true);

    loadFxn()
        .then(() => {
            logger.log(`triggerLoadFxn finished`);
            setIsLoading(false);
        })
        .catch((err) => {
            if (err.message.includes(GET_FEED_BUSY_MSG)) {
                // Don't flip the isLoading state if the feed is busy
                logger.error(`triggerLoadFxn ${LOADING_ERROR_MSG}`);
                setError(LOADING_ERROR_MSG);
            } else {
                const msg = `Failed to triggerLoadFxn with error:`;
                logger.error(msg, err);
                setError(`${msg} ${err}`);
                setIsLoading(false);
            }
        });
};
