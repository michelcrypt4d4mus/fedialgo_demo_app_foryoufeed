/*
 * Render an action button for a status (toot).
 * The action button can be a favourite, reblog, bookmark, reply, or score button.
 */
import React, { CSSProperties } from "react";

import { capitalCase } from "change-case";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FEDIALGO, Account, KeysOfValueType, Toot, isValueInStringEnum } from "fedialgo";
import {
    IconDefinition,
    faBalanceScale,
    faBookmark,
    faReply,
    faRetweet,
    faStar,
    faUserPlus,
    faUserMinus,
    faVolumeMute
} from "@fortawesome/free-solid-svg-icons";

import { confirm } from "../Confirmation";
import { logMsg, scoreString } from "../../helpers/string_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

export enum AccountAction {
    Follow = 'follow',
    Mute = 'mute',
};

export enum TootAction {
    Bookmark = 'bookmark',
    Favourite = 'favourite',
    Reblog = 'reblog',
    Reply = 'reply',
    Score = 'score',
}

export type ButtonAction = AccountAction | TootAction;
const isAccountAction = (value: string | ButtonAction) => isValueInStringEnum(AccountAction)(value);
const isTootAction = (value: string | ButtonAction) => isValueInStringEnum(TootAction)(value);

type ActionInfo = {
    booleanName?: KeysOfValueType<Account, boolean> | KeysOfValueType<Toot, boolean>,
    countName?: KeysOfValueType<Toot, number>,
    icon: IconDefinition,
    label?: string,
};

const ACTION_INFO: Record<ButtonAction, ActionInfo> = {
    [TootAction.Bookmark]: {
        booleanName: `${TootAction.Bookmark}ed`,
        icon: faBookmark
    },
    [TootAction.Favourite]: {
        booleanName: `${TootAction.Favourite}d`,
        countName: `${TootAction.Favourite}sCount`,
        icon: faStar,
    },
    [AccountAction.Follow]: {
        booleanName: `isFollowed`,
        icon: faUserPlus,
    },
    [AccountAction.Mute]: {
        booleanName: `${AccountAction.Mute}d`,
        icon: faVolumeMute,
    },
    [TootAction.Reblog]: {
        booleanName: 'reblogged',
        countName: 'reblogsCount',
        icon: faRetweet,
    },
    [TootAction.Reply]: {
        countName: 'repliesCount',
        icon: faReply,
    },
    [TootAction.Score]: {
        icon: faBalanceScale,
        label: "Show Score",
    },
};

// Sizing icons: https://docs.fontawesome.com/web/style/size
const ACCOUNT_ACTION_BUTTON_CLASS = "fa-xs";
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
    let label = actionInfo.label || capitalCase(action);
    let actionTarget: Account | Toot = status;
    let className = ACTION_ICON_BASE_CLASS;
    let buttonText: string;
    let icon = actionInfo.icon;

    if (isAccountAction(action)) {
        actionTarget = status.account;
        className += ` ${ACCOUNT_ACTION_BUTTON_CLASS}`;

        if (action == AccountAction.Follow && actionTarget[actionInfo.booleanName]) {
            icon = faUserMinus;
            label = `Unfollow`;
        }

        label += ` ${status.account.webfingerURI}`;
    } else {
        if (actionInfo.countName && status[actionInfo.countName] > 0) {
            buttonText = status[actionInfo.countName]?.toLocaleString();
        } else if (action == TootAction.Score) {
            buttonText = scoreString(status.scoreInfo?.score);
        }
    }

    const [currentState, setCurrentState] = React.useState<boolean>(actionTarget[actionInfo.booleanName]);

    // If the action is a boolean (fave, reblog, bookmark) set the className active/inactive
    if (actionInfo.booleanName) {
        className += currentState ? " active activate" : " deactivate";
    }

    // Returns a function that's called when state changes for faves, bookmarks, retoots
    const performAction = () => {
        return () => {
            if (isAccountAction(action)) return performAccountAction()();

            const actionInfo = ACTION_INFO[action];
            const startingCount = status[actionInfo.countName] || 0;
            const startingState = !!status[actionInfo.booleanName];
            const newState = !startingState;

            // Optimistically update the GUI (we will reset to original state if the server call fails later)
            logMsg(`${action}() toot (startingState: ${startingState}, count: ${startingCount}): `, status);
            status[actionInfo.booleanName] = newState;
            setCurrentState(newState);

            if (newState && actionInfo.countName && action != TootAction.Reply) {
                status[actionInfo.countName] = startingCount + 1;
            } else {
                status[actionInfo.countName] = startingCount ? (startingCount - 1) : 0;  // Avoid count going below 0
            }

            (async () => {
                try {
                    const resolvedToot = await status.resolve();
                    const selected = api.v1.statuses.$select(resolvedToot.id);

                    if (action == TootAction.Bookmark) {
                        await (newState ? selected.bookmark() : selected.unbookmark());
                    } else if (action == TootAction.Favourite) {
                        await (newState ? selected.favourite() : selected.unfavourite());
                    } else if (action == TootAction.Reblog) {
                        await (newState ? selected.reblog() : selected.unreblog());
                    } else {
                        throw new Error(`Unknown action: ${action}`);
                    }

                    logMsg(`Successfully changed ${action} bool to ${newState}`);
                } catch (error) {
                    // If there's an error, roll back the change to the original state
                    const msg = `Failed to ${action} toot! (${error.message})`;
                    console.error(`${msg} Resetting count to ${status[actionInfo.countName]}`, error);
                    setCurrentState(startingState);
                    status[actionInfo.booleanName] = startingState;
                    if (actionInfo.countName) status[actionInfo.countName] = startingCount;
                    setError(msg);
                }
            })();
        };
    };

    const performAccountAction = () => {
        return () => {
            (async () => {
                const confirmTxt = `Are you sure you want to ${label.toLowerCase()}?`;
                if (!(await confirm(confirmTxt))) return;

                const resolvedToot = await status.resolve();
                const startingState = !!resolvedToot.account[actionInfo.booleanName];
                const newState = !startingState;

                logMsg(`${action}() account (startingState: ${startingState}): `, status);
                status.account[actionInfo.booleanName] = newState;
                resolvedToot.account[actionInfo.booleanName] = newState;
                setCurrentState(newState);
                const selected = api.v1.accounts.$select(resolvedToot.account.id);

                try {
                    if (action == AccountAction.Follow) {
                        await (newState ? selected.follow() : selected.unfollow());
                    } else if (action == AccountAction.Mute) {
                        await (newState ? selected.mute() : selected.unmute());
                        await algorithm.refreshMutedAccounts();
                    } else {
                        throw new Error(`Unknown action: ${action}`);
                    }

                    logMsg(`Successfully changed ${action} bool to ${newState}`);
                } catch (error) {
                    // If there's an error, roll back the change to the original state
                    let msg = `Failed to ${action} account! You may have used ${FEDIALGO} before it requested`;
                    msg += ` permission to ${action} accounts. This can be fixed by clearing your cookies for this site.`;
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
            className={className}
            onClick={onClick || performAction()}
            style={isAccountAction(action) ? accountActionButtonStyle : tootActionButtonStyle}
            title={label}
            type="button"
        >
            <FontAwesomeIcon aria-hidden="true" className="fa-fw" icon={icon} />

            {buttonText &&
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


const accountActionButtonStyle: CSSProperties = {
    marginTop: "5px",
    transform: "translate(0px, 2px)",
};

const tootActionButtonStyle: CSSProperties = {
    fontSize: "18px",
    height: "23.142857px",
    lineHeight: "18px",
    width: "auto",
};
