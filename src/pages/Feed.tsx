/*
 * Class for retrieving and sorting the user's feed based on their chosen weighting values.
 */
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "react-bootstrap";
import { usePersistentState } from "react-persistent-state";

import Container from "react-bootstrap/esm/Container";
import { mastodon, createRestAPIClient as loginToMastodon } from "masto";
import { FeedFilterSettings, ScoresType, TheAlgorithm, Toot } from "fedialgo";

import FindFollowers from "../components/FindFollowers";
import FullPageIsLoading from "../components/FullPageIsLoading";
import StatusComponent from "../components/Status";
import useOnScreen from "../hooks/useOnScreen";
import WeightSetter from "../components/WeightSetter";
import { useAuth } from "../hooks/useAuth";

const DEFAULT_NUM_TOOTS = 20;
const NUM_TOOTS_TO_LOAD_ON_SCROLL = 10;
const FEED_WIDTH = '800px';


export default function Feed() {
    // Contruct Feed on Page Load
    const { user, logout } = useAuth();

    // State variables
    const [algorithm, setAlgorithm] = useState<TheAlgorithm>(null); //algorithm to use
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);  // true if page is still loading
    const [userWeights, setUserWeights] = useState<ScoresType>({});  // weights for each factor
    const [feed, setFeed] = useState<Toot[]>([]); // timeline toots

    // Persistent state variables
    const [numDisplayedToots, setNumDisplayedToots] = usePersistentState<number>(DEFAULT_NUM_TOOTS, user.id + "numDisplayedToots"); //how many toots to show
    const [scrollPos, setScrollPos] = usePersistentState<number>(0, user.id + "scroll"); //scroll position

    window.addEventListener("scroll", () => {
        if (window.scrollY % 10 == 0) setScrollPos(window.scrollY);
    });

    const api: mastodon.rest.Client = loginToMastodon({url: user.server, accessToken: user.access_token});
    const bottomRef = useRef<HTMLDivElement>(null);
    const isBottom = useOnScreen(bottomRef);  // TODO: this works after the initial load but after loading from cache it doesn't work sometimes?

    // Load the posts in the feed either from mastodon server or from the cache
    useEffect(() => {
        constructFeed();
    }, []);

    // Show more toots when the user scrolls to bottom of the page
    // TODO: This doesn't actually trigger any API calls, it just shows more of the preloaded toots
    useEffect(() => {
        if (isBottom) {
            console.log("hit bottom of page; should load more toots...");
            showMoreToots();
        }
    }, [isBottom]);

    // Check that we have valid user credentials and load timeline toots, otherwise force a logout.
    const constructFeed = async (): Promise<void> => {
        console.log(`constructFeed() called with user ID ${user?.id} ('feed' currently contains ${feed.length} toots)`);
        let currentUser: mastodon.v1.Account;

        try {
            if (!user) throw new Error(`User not set in constructFeed()!`);
            currentUser = await api.v1.accounts.verifyCredentials();
        } catch (error) {
            console.warn(`Failed to verifyCredentials() with error:`, error);
            logout();
            return;
        }

        const algo = await TheAlgorithm.create({api: api, user: currentUser, setFeedInApp: setFeed});
        console.log(`algorithm created, calling app level setFeed()`, algo);
        setFeed(algo.feed);
        setAlgorithm(algo);
        setUserWeights(await algo.getUserWeights());
        setIsLoading(false);
        setFeed(await algo.getFeed());
    };

    // Pull more toots to display from our local cached and sorted toot feed
    // TODO: this should trigger the pulling of more toots from the server if we run out of local cache
    const showMoreToots = () => {
        console.log(`numDisplayedToots=${numDisplayedToots}, feed.length=${feed.length}. loading ${NUM_TOOTS_TO_LOAD_ON_SCROLL} more toots...`);
        setNumDisplayedToots(numDisplayedToots + NUM_TOOTS_TO_LOAD_ON_SCROLL);
    };

    // Learn weights based on user action    // TODO: does learning weights really work?
    const weightAdjust = async (scores: ScoresType) => {
        const newWeights = await algorithm.learnWeights(scores);
        console.log("new userWeights in weightAdjust():", newWeights);
        setUserWeights(newWeights);
    };

    // Update the user weightings stored in TheAlgorithm when a user moves a weight slider
    const updateWeights = async (newWeights: ScoresType): Promise<ScoresType> => {
        console.log(`updateWeights() called...`);
        setUserWeights(newWeights);

        if (algorithm) {
            const newFeed = await algorithm.updateUserWeights(newWeights);
            setFeed(newFeed);
        } else {
            console.warn(`'algorithm' variable not set, can't updateWeights()!`);
        }

        console.log(`updateWeights() finished...`);
        return newWeights;
    };

    if (algorithm && algorithm.feed.length != feed.length) {
        console.log(`filtered ${feed.length} of ${algorithm.feed.length} toots:`, feed);
    }

    return (
        <Container style={{backgroundColor: '#15202b', height: 'auto', maxWidth: FEED_WIDTH}}>
            <Modal show={error !== ""} onHide={() => setError("")}>
                <Modal.Header closeButton>
                    <Modal.Title>Error</Modal.Title>
                </Modal.Header>

                <Modal.Body>{error}</Modal.Body>
            </Modal>

            {algorithm &&
                <WeightSetter
                    algorithm={algorithm}
                    updateFilters={(newFilters) => algorithm.updateFilters(newFilters)}
                    updateWeights={updateWeights}
                    userWeights={userWeights}
                />}

            <FindFollowers api={api} user={user} />

            {!isLoading && api && (feed.length >= 1) &&
                feed.slice(0, Math.max(DEFAULT_NUM_TOOTS, numDisplayedToots)).map((toot: Toot) => (
                    <StatusComponent
                        api={api}
                        key={toot.uri}
                        setError={setError}
                        status={toot}
                        user={user}
                        weightAdjust={weightAdjust}
                    />
                ))}

            {(feed.length == 0 || isLoading) && <FullPageIsLoading />}
            <div ref={bottomRef} onClick={showMoreToots}>Load More</div>
        </Container>
    );
};
