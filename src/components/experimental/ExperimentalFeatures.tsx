/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties, useState } from "react";
import { Button } from 'react-bootstrap';

import { FEDIALGO } from 'fedialgo';

import FindFollowers from "./FindFollowers";
import JsonModal from "../helpers/JsonModal";
import StatsModal from "./StatsModal";
import TopLevelAccordion from "../helpers/TopLevelAccordion";
import { accordionSubheader, roundedBox } from "../../helpers/style_helpers";
import { logMsg, versionString } from "../../helpers/string_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";
import { useAuthContext } from "../../hooks/useAuth";
import { useError } from "../helpers/ErrorHandler";

const SCORE_STATS = "Show Score Stats";
const SHOW_STATE = "Show State";
const LOAD_COMPLETE_USER_HISTORY = "Load Complete User History";

const BUTTON_TEXT = {
    [SCORE_STATS]: "Show a bar chart of the scores of your timeline",
    [SHOW_STATE]: `Show a bunch of information about ${FEDIALGO}'s internal state`,
    [LOAD_COMPLETE_USER_HISTORY]: "Load all your toots and favourites. May improve scoring of your feed. " +
                                  "Takes time & resources proportional to the number of times you've tooted.",
};


export default function ExperimentalFeatures() {
    const { algorithm, api, isLoading, timeline, triggerPullAllUserData } = useAlgorithm();
    const { setError } = useError();
    const { user } = useAuthContext();

    const [algoState, setAlgoState] = useState({});
    const [isLoadingState, setIsLoadingState] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);
    const [showStatsModal, setShowStatsModall] = useState(false);

    const showAlgoState = () => {
        logMsg(`State (isLoading=${isLoading}, algorithm.isLoading()=${algorithm.isLoading()}, timeline.length=${timeline.length})`);
        setIsLoadingState(true);

        // Wait for the data to show up
        algorithm.getCurrentState()
            .then((currentState) => {
                logMsg("FediAlgo state:", currentState);
                currentState.version = versionString();
                setAlgoState(currentState);
                setShowStateModal(true);
            })
            .catch((error) => setError(`Failed to get algorithm state: ${error}`))
            .finally(() => setIsLoadingState(false));
        ;
    }

    const makeLabeledButton = (label: keyof typeof BUTTON_TEXT, onClick: () => void, variant?: string) => (
        <li key={label} style={listElement}>
            <Button
                className='p-2 text-center'
                disabled={isLoading}
                onClick={onClick}
                size="sm"
                style={buttonStyle}
                variant={variant || "primary"}
            >
                {isLoading || isLoadingState ? "Loading..." : label}
            </Button>

            <div style={{flex: 4, marginLeft: "10px", fontSize: "14px"}}>
                {BUTTON_TEXT[label]}
            </div>
        </li>
    );

    return (
        <TopLevelAccordion title="Experimental Features">
            <JsonModal
                dialogClassName="modal-lg"
                infoTxt="A window into FediAlgo's internal state."
                json={algoState}
                jsonViewProps={{
                    collapsed: 1,
                    displayObjectSize: true,
                    name: "state",
                }}
                setShow={setShowStateModal}
                show={showStateModal}
                title="FediAlgo State"
            />

            <StatsModal
                setShow={setShowStatsModall}
                show={showStatsModal}
                title="FediAlgo Score Stats"
            />

            <p style={{...accordionSubheader, paddingTop: "2px"}}>
                Use with caution.
            </p>

            <div style={container}>
                <ul style={listStyle}>
                    {makeLabeledButton(SHOW_STATE, showAlgoState)}
                    <hr className="hr" />
                    {makeLabeledButton(SCORE_STATS, () => setShowStatsModall(true))}
                    <hr className="hr" />
                    {makeLabeledButton(LOAD_COMPLETE_USER_HISTORY, triggerPullAllUserData)}
                </ul>

                <hr className="hr" />
                <FindFollowers api={api} user={user} />
            </div>
        </TopLevelAccordion>
    );
};


const container: CSSProperties = {
    ...roundedBox,
    paddingBottom: "20px",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingTop: "20px",
};

const buttonStyle: CSSProperties = {
    // borderColor: "black",
    // borderWidth: "1px",
    flex: 2,
    marginBottom: "5px",
    marginTop: "5px",
};

const listElement: CSSProperties = {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    fontSize: "18px",
    marginBottom: "7px",
};

const listStyle: CSSProperties = {
    // listStyle: "disc",
};

const subheader: CSSProperties = {
    marginBottom: "7px",
};
