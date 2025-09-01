/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import { Button } from "react-bootstrap";
import { CSSProperties, useState } from "react";

import { FEDIALGO } from "fedialgo";

import FindFollowers from "./FindFollowers";
import JsonModal from "../helpers/JsonModal";
import StatsModal from "./StatsModal";
import TopLevelAccordion from "../helpers/TopLevelAccordion";
import { accordionSubheader, centerAlignedFlexRow, roundedBox, TEXT_CENTER_P2 } from "../../helpers/style_helpers";
import { getLogger } from "../../helpers/log_helpers";
import { confirm } from "../helpers/Confirmation";
import { useAlgorithm } from "../../hooks/useAlgorithm";
import { useAuthContext } from "../../hooks/useAuth";
import { useError } from "../helpers/ErrorHandler";
import { versionString } from "../../helpers/string_helpers";

const DELETE_ALL = "Delete All User Data";
const LOAD_COMPLETE_USER_HISTORY = "Load Complete User History";
const SCORE_STATS = "Show Score Stats";
const SHOW_STATE = "Show State";

const logger = getLogger("ExperimentalFeatures");

const BUTTON_TEXT = {
    [DELETE_ALL]: "Wipe all user data including the registered app. Necessary to handle OAuth permissions errors." +
                  " You'll need to reauthenticate afterwards.",
    [LOAD_COMPLETE_USER_HISTORY]: "Load all your toots and favourites. May improve scoring of your feed." +
                                  " Takes time & resources proportional to the number of times you've tooted.",
    [SCORE_STATS]: "Show some charts breaking down the way your timeline is being scored when looked at in deciles.",
    [SHOW_STATE]: `Show a bunch of information about ${FEDIALGO}'s internal state and configuration.`,
};

export const OAUTH_ERROR_MSG = `If you were trying to bookmark, mute, or reply with an image you may have used` +
        ` ${FEDIALGO} before it requested the appropriate permissions to perform those actions.` +
        ` This can be fixed with the "${DELETE_ALL}" button in the Experimental Features` +
        ` section or by manually clearing your browser's local storage (cookies and everything else) for this site.` +
        ` and then logging back in.`;


export default function ExperimentalFeatures() {
    const { algorithm, isLoading, lastLoadDurationSeconds, timeline, triggerPullAllUserData } = useAlgorithm();
    const { logout, setApp } = useAuthContext();
    const { logAndSetError } = useError();

    const [algoState, setAlgoState] = useState({});
    const [isLoadingState, setIsLoadingState] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);

    // Show modal with algorithm internal state
    const showAlgoState = () => {
        logger.log(`State (isLoading=${isLoading}, algorithm.isLoading=${algorithm.isLoading}, timeline.length=${timeline.length})`);
        setIsLoadingState(true);

        algorithm.getCurrentState()
            .then((currentState) => {
                logger.log("FediAlgo state:", currentState);
                currentState.version = versionString();
                currentState.lastLoadDurationSeconds = lastLoadDurationSeconds;
                setAlgoState(currentState);
                setShowStateModal(true);
            })
            .catch((error) => logAndSetError(logger, `Failed to get algorithm state!`, error))
            .finally(() => setIsLoadingState(false));

    }

    // Reset all state except for the user and server
    const wipeAll = async () => {
        if (!(await confirm(`Are you sure you want to completely wipe all FediAlgo data and start over?`))) return;
        setApp(null);
        await algorithm?.reset(true);
        logout();
    };

    const makeLabeledButton = (label: keyof typeof BUTTON_TEXT, onClick: () => void, variant?: string) => (
        <li key={label} style={buttonListItem}>
            <Button
                className={TEXT_CENTER_P2}
                disabled={isLoading}
                onClick={onClick}
                size="sm"
                style={buttonStyle}
                variant={variant || "primary"}
            >
                {isLoading || isLoadingState ? "Loading..." : label}
            </Button>

            <div style={buttonDescription}>
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
                setShow={setShowStatsModal}
                show={showStatsModal}
                title="FediAlgo Score Stats"
            />

            <p style={{...accordionSubheader, paddingTop: "2px"}}>
                Use with caution.
            </p>

            <div style={container}>
                <ul>
                    {makeLabeledButton(SHOW_STATE, showAlgoState)}
                    <hr className="hr hr-narrow" />
                    {makeLabeledButton(SCORE_STATS, () => setShowStatsModal(true))}
                    <hr className="hr hr-narrow" />
                    {makeLabeledButton(LOAD_COMPLETE_USER_HISTORY, triggerPullAllUserData)}
                    <hr className="hr hr-narrow" />
                    {makeLabeledButton(DELETE_ALL, wipeAll, "danger")}
                </ul>

                <hr className="hr hr-narrow" />
                <FindFollowers/>
            </div>
        </TopLevelAccordion>
    );
};


const buttonDescription: CSSProperties = {
    flex: 4,
    fontSize: 14,
    marginLeft: "10px",
};

const buttonListItem: CSSProperties = {
    ...centerAlignedFlexRow,
    fontSize: 18,
    marginBottom: "2px",
};

const buttonStyle: CSSProperties = {
    flex: 2,
    marginBottom: "5px",
    marginTop: "5px",
};

const container: CSSProperties = {
    ...roundedBox,
    paddingBottom: "20px",
    paddingLeft: "20px",
};
