/*
 * Render an action button for a status (toot).
 * The action button can be a favourite, reblog, bookmark, reply, or score button.
 */
import React, { CSSProperties } from "react";

import { capitalCase } from "change-case";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FEDIALGO, Toot } from "fedialgo";
import {
    IconDefinition,
    faBalanceScale,
    faBookmark,
    faReply,
    faRetweet,
    faStar,
    faUserPlus,
    faVolumeMute
} from "@fortawesome/free-solid-svg-icons";

import { logMsg, scoreString } from "../../helpers/string_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

export enum ButtonAction {
    Bookmark = 'bookmark',
    Favourite = 'favourite',
    Follow = 'follow',
    Mute = 'mute',
    Reblog = 'reblog',
    Reply = 'reply',
    Score = 'score',
};

type ActionInfo = {
    booleanName?: string,
    className?: string,
    countName?: string,
    icon: IconDefinition,
    isAccountAction?: boolean,
    style?: CSSProperties,
};

// Sizing icons: https://docs.fontawesome.com/web/style/size
const ACCOUNT_ACTION_BUTTON_CLASS = "fa-xs";

const ACCOUNT_ACTION_BUTTON_STYLE = {
    transform: "translate(0px, 2px)",
    marginTop: "5px",
};

const ACTION_INFO: Record<ButtonAction, ActionInfo> = {
    [ButtonAction.Bookmark]: {
        booleanName: `${ButtonAction.Bookmark}ed`,
        icon: faBookmark
    },
    [ButtonAction.Favourite]: {
        booleanName: `${ButtonAction.Favourite}d`,
        countName: `${ButtonAction.Favourite}sCount`,
        icon: faStar,
    },
    [ButtonAction.Follow]: {
        booleanName: `${ButtonAction.Follow}ed`,
        className: ACCOUNT_ACTION_BUTTON_CLASS,
        icon: faUserPlus,
        isAccountAction: true,
        style: ACCOUNT_ACTION_BUTTON_STYLE
    },
    [ButtonAction.Mute]: {
        booleanName: `${ButtonAction.Follow}d`,
        className: ACCOUNT_ACTION_BUTTON_CLASS,
        icon: faVolumeMute,
        isAccountAction: true,
        style: ACCOUNT_ACTION_BUTTON_STYLE
    },
    [ButtonAction.Reblog]: {
        booleanName: 'reblogged',
        countName: 'reblogsCount',
        icon: faRetweet,
    },
    [ButtonAction.Reply]: {
        countName: 'repliesCount',
        icon: faReply,
    },
    [ButtonAction.Score]: {
        icon: faBalanceScale,
    },
};

const ICON_BUTTON_CLASS = "status__action-bar__button icon-button"
const ACTION_ICON_BASE_CLASS = `${ICON_BUTTON_CLASS} icon-button--with-counter`;

interface ActionButtonProps {
    action: ButtonAction,
    onClick?: (e: React.MouseEvent) => void,
    status: Toot,
};


export default function ActionButton(props: ActionButtonProps) {
    const { action, onClick, status } = props;
    const { algorithm, api, setError } = useAlgorithm();
    const actionInfo = ACTION_INFO[action];
    const [currentState, setCurrentState] = React.useState<boolean>(status[actionInfo.booleanName]);

    const label = action == ButtonAction.Score ? "Show Score" : capitalCase(action)
    let className = ACTION_ICON_BASE_CLASS;
    let buttonText: string | number;

    if (actionInfo.countName) {
        buttonText = status[actionInfo.countName];
        buttonText = (typeof buttonText == "number" && buttonText) > 0 ? buttonText.toLocaleString() : buttonText;
    } else if (action == ButtonAction.Score) {
        buttonText = scoreString(status.scoreInfo?.score);
    }

    // If the action is a boolean (fave, reblog, bookmark) set the className active/inactive
    if (actionInfo.booleanName) {
        className += currentState ? " active activate" : " deactivate";
    }

    // Returns a function that's called when state changes for faves, bookmarks, retoots
    const performAction = (actionName: ButtonAction, actionInfo: ActionInfo) => {
        return () => {
            if (actionInfo.isAccountAction) return performAccountAction(actionName)();

            const startingCount = status[actionInfo.countName] == true ? 1 : (status[actionInfo.countName] || 0);
            const startingState = !!status[actionInfo.booleanName];
            const newState = !startingState;

            // Optimistically update the GUI (we will reset to original state if the server call fails later)
            logMsg(`${actionName}() toot (startingState: ${startingState}, count: ${startingCount}): `, status);
            status[actionInfo.booleanName] = newState;
            setCurrentState(newState);

            if (newState && actionInfo.countName && actionName != ButtonAction.Reply) {
                status[actionInfo.countName] = startingCount + 1;
            } else {
                status[actionInfo.countName] = startingCount ? (startingCount - 1) : 0;  // Avoid count going below 0
            }

            (async () => {
                try {
                    const resolvedToot = await status.resolve();
                    const selected = api.v1.statuses.$select(resolvedToot.id);

                    if (actionName == ButtonAction.Bookmark) {
                        await (newState ? selected.bookmark() : selected.unbookmark());
                    } else if (actionName == ButtonAction.Favourite) {
                        await (newState ? selected.favourite() : selected.unfavourite());
                    } else if (actionName == ButtonAction.Reblog) {
                        await (newState ? selected.reblog() : selected.unreblog());
                    } else {
                        throw new Error(`Unknown actionName: ${actionName}`);
                    }

                    logMsg(`Successfully changed ${actionName} bool to ${newState}`);
                } catch (error) {
                    // If there's an error, roll back the change to the original state
                    const msg = `Failed to ${actionName} toot! (${error.message})`;
                    console.error(`${msg} Resetting count to ${status[actionInfo.countName]}`, error);
                    setCurrentState(startingState);
                    status[actionInfo.booleanName] = startingState;
                    if (actionInfo.countName) status[actionInfo.countName] = startingCount;
                    setError(msg);
                }
            })();
        };
    };

    const performAccountAction = (actionName: ButtonAction) => {
        return () => {
            (async () => {
                if (!window.confirm(`Are you sure?`)) return;

                const resolvedToot = await status.resolve();
                const startingState = !!resolvedToot.account[actionInfo.booleanName];
                const newState = !startingState;

                logMsg(`${actionName}() account (startingState: ${startingState}): `, status);
                status.account[actionInfo.booleanName] = newState;
                resolvedToot.account[actionInfo.booleanName] = newState;
                setCurrentState(newState);
                const selected = api.v1.accounts.$select(resolvedToot.account.id);

                try {
                    if (actionName == ButtonAction.Follow) {
                        await (newState ? selected.follow() : selected.unfollow());
                    } else if (actionName == ButtonAction.Mute) {
                        await (newState ? selected.mute() : selected.unmute());
                        await algorithm.refreshMutedAccounts();
                    } else {
                        throw new Error(`Unknown actionName: ${actionName}`);
                    }

                    logMsg(`Successfully changed ${actionName} bool to ${newState}`);
                } catch (error) {
                    // If there's an error, roll back the change to the original state
                    let msg = `Failed to ${actionName} account! You may have used ${FEDIALGO} before it requested`;
                    msg += ` permission to ${actionName} accounts. This can be fixed by clearing your cookies for this site.`;
                    msg += `\n(${error.message})`;
                    console.error(`${msg} Resetting state to ${startingState}`, error);
                    setCurrentState(startingState);
                    status.account[actionInfo.booleanName] = startingState;
                    resolvedToot.account[actionInfo.booleanName] = startingState;
                    setError(msg);
                }
            })();
        };
    };

    return (
        <button
            aria-hidden="false"
            aria-label={label}
            className={className + (actionInfo.className ? ` ${actionInfo.className}` : "")}
            onClick={onClick || performAction(action, actionInfo)}
            style={actionInfo.style || {...buttonStyle}}
            title={label}
            type="button"
        >
            <FontAwesomeIcon aria-hidden="true" className="fa-fw" icon={actionInfo.icon} />

            {(buttonText || buttonText === 0) &&
                <span className="icon-button__counter">
                    <span className="animated-number">
                        <span style={{position: "static"}}>
                            <span>{buttonText}</span>
                        </span>
                    </span>
                </span>}
        </button>
    );
};


const buttonStyle: CSSProperties = {
    fontSize: "18px",
    height: "23.142857px",
    lineHeight: "18px",
    width: "auto",
};
