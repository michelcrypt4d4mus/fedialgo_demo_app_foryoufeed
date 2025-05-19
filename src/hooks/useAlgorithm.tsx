/*
 * Context to hold the TheAlgorithm variable
 */
import React, { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import TheAlgorithm, { GET_FEED_BUSY_MSG, Toot, isAccessTokenRevokedError } from "fedialgo";
import { createRestAPIClient, mastodon } from "masto";

import { LOADING_ERROR_MSG, errorMsg, logMsg, warnMsg } from "../helpers/string_helpers";
import { useAuthContext } from "./useAuth";

const FOCUS = "focus";
const RELOAD_IF_OLDER_THAN_MINUTES = 5;
const RELOAD_IF_OLDER_THAN_SECONDS = 60 * RELOAD_IF_OLDER_THAN_MINUTES;


interface AlgoContext {
    algorithm?: TheAlgorithm,
    api?: mastodon.rest.Client,
    isLoading?: boolean,
    setError?: (error: string) => void,
    setShouldAutoUpdate?: (should: boolean) => void,
    shouldAutoUpdate?: boolean,
    timeline: Toot[],
    triggerFeedUpdate?: (moreOldToots?: boolean) => void,
    triggerPullAllUserData?: () => void,
};

const AlgorithmContext = createContext<AlgoContext>({timeline: []});
export const useAlgorithm = () => useContext(AlgorithmContext);

interface AlgorithmContextProps extends PropsWithChildren {
    setError?: (error: string) => void,
};


export default function AlgorithmProvider(props: AlgorithmContextProps) {
    const { children, setError } = props;
    const { logout, user } = useAuthContext();

    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null);
    const [isLoading, setIsLoading] = useState(true);
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
            console.warn(`constructFeed() useEffect called without user, skipping initial load`);
            return;
        }

        // Check that we have valid user credentials and load timeline toots, otherwise force a logout.
        const constructFeed = async (): Promise<void> => {
            logMsg(`constructFeed() called with user ID ${user?.id} (feed already has ${timeline.length} toots)`);
            let currentUser: mastodon.v1.Account;

            try {
                currentUser = await api.v1.accounts.verifyCredentials();
            } catch (err) {
                if (isAccessTokenRevokedError(err)) {
                    warnMsg(`Access token has been revoked, logging out...`);
                } else {
                    errorMsg(`Logging out, failed to verifyCredentials() with error:`, err);
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
                if (!isLoading) warnMsg(`isLoading is true but ${msg}`);
            } else {
                const feedAgeInSeconds = algorithm.mostRecentHomeTootAgeInSeconds();

                if (feedAgeInSeconds) {
                    msg = `feed is ${feedAgeInSeconds.toFixed(0)}s old`;
                    should = feedAgeInSeconds > RELOAD_IF_OLDER_THAN_SECONDS;
                } else {
                    msg = `${timeline.length} toots in feed but no most recent toot found!`;
                    warnMsg(msg);
                }
            }

            logMsg(`shouldReloadFeed() returning ${should} (${msg})`);
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
        setError,
        setShouldAutoUpdate,
        shouldAutoUpdate,
        timeline,
        triggerFeedUpdate,
        triggerPullAllUserData
    };

    return (
        <AlgorithmContext.Provider value={algoContext}>
            {children}
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
            logMsg(`triggerLoadFxn finished`);
            setIsLoading(false);
        })
        .catch((err) => {
            if (err.message.includes(GET_FEED_BUSY_MSG)) {
                // Don't flip the isLoading state if the feed is busy
                warnMsg(`triggerLoadFxn ${LOADING_ERROR_MSG}`);
                setError(LOADING_ERROR_MSG);
            } else {
                const msg = `Failed to triggerLoadFxn with error:`;
                errorMsg(msg, err);
                setError(`${msg} ${err}`);
                setIsLoading(false);
            }
        });
};
