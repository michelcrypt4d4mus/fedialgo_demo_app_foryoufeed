/*
 * Render an action button for a status (toot).
 * The action button can be a favourite, reblog, bookmark, reply, or score button.
 */
import React, { CSSProperties } from "react";

import { Account, Toot, isValueInStringEnum } from "fedialgo";
import { capitalCase } from "change-case";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    IconDefinition,
    faBalanceScale,
    faBookmark,
    faReply,
    faRetweet,
    faStar,
    faUserMinus,
    faUserPlus,
    faVolumeMute,
} from "@fortawesome/free-solid-svg-icons";

import { config } from "../../config";
import { confirm } from "../helpers/Confirmation";
import { getLogger } from "../../helpers/log_helpers";
import { NETWORK_ERROR, scoreString } from "../../helpers/string_helpers";
import { OAUTH_ERROR_MSG } from "../experimental/ExperimentalFeatures";
import { useAlgorithm } from "../../hooks/useAlgorithm";
import { useError } from "../helpers/ErrorHandler";

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
};

export type ButtonAction = AccountAction | TootAction;
const isAccountAction = (value: string | ButtonAction) => isValueInStringEnum(AccountAction)(value);
const isTootAction = (value: string | ButtonAction) => isValueInStringEnum(TootAction)(value);

// Sizing icons: https://docs.fontawesome.com/web/style/size
const ACCOUNT_ACTION_BUTTON_CLASS = "fa-xs";
const ICON_BUTTON_CLASS = "status__action-bar__button icon-button"
const ACTION_ICON_BASE_CLASS = `${ICON_BUTTON_CLASS} icon-button--with-counter`;

type AccountBoolean = "isFollowed" | "muted";
type TootBoolean = "bookmarked" | "favourited" | "reblogged";
type TootCount = "reblogsCount" | "favouritesCount" | "repliesCount";

type ActionInfo = {
    booleanName?: AccountBoolean | TootBoolean,
    countName?: TootCount,
    icon: IconDefinition,
    label?: string,
};

const ACTION_INFO: Record<ButtonAction, ActionInfo> = {
    [TootAction.Bookmark]: {
        booleanName: "bookmarked",
        icon: faBookmark
    },
    [TootAction.Favourite]: {
        booleanName: "favourited",
        countName: `${TootAction.Favourite}sCount`,
        icon: faStar,
    },
    [AccountAction.Follow]: {
        booleanName: `isFollowed`,
        icon: faUserPlus,
    },
    [AccountAction.Mute]: {
        booleanName: "muted",
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

const logger = getLogger("ActionButton");

interface ActionButtonProps {
    action: ButtonAction,
    onClick?: (e: React.MouseEvent) => void,
    toot: Toot,
};


export default function ActionButton(props: ActionButtonProps) {
    const { action, onClick, toot } = props;
    const { algorithm, api } = useAlgorithm();
    const { logAndSetError, logAndSetFormattedError } = useError();

    const actionInfo = ACTION_INFO[action];
    let label = actionInfo.label || capitalCase(action);
    let actionTarget: Account | Toot = toot;
    let className = ACTION_ICON_BASE_CLASS;
    let buttonText: string;
    let icon = actionInfo.icon;

    if (isAccountAction(action)) {
        actionTarget = toot.account;
        className += ` ${ACCOUNT_ACTION_BUTTON_CLASS}`;

        if (action == AccountAction.Follow && actionTarget[actionInfo.booleanName]) {
            icon = faUserMinus;
            label = `Unfollow`;
        }

        label += ` ${toot.account.webfingerURI}`;
    } else {
        if (actionInfo.countName && toot[actionInfo.countName] > 0) {
            buttonText = toot[actionInfo.countName]?.toLocaleString();
        } else if (action == TootAction.Score) {
            buttonText = scoreString(toot.scoreInfo?.score);
        }
    }

    const [currentState, setCurrentState] = React.useState<boolean>(actionTarget[actionInfo.booleanName]);

    // If the action is a boolean (fave, reblog, bookmark) set the className active/inactive
    if (actionTarget[actionInfo.booleanName]) {
        className += currentState ? " active activate" : " deactivate";
    }

    // Returns a function that's called when state changes for faves, bookmarks, retoots
    const performAction = () => {
        return () => {
            if (isAccountAction(action)) return performAccountAction()();

            const startingCount = toot[actionInfo.countName] || 0;
            const startingState = !!toot[actionInfo.booleanName];
            const newState = !startingState;
            logger.log(`${action}() toot (startingState: ${startingState}, count: ${startingCount}): `, toot);
            // Optimistically update the GUI (we will reset to original state if the server call fails later)
            toot[actionInfo.booleanName as TootBoolean] = newState;
            setCurrentState(newState);

            if (newState && actionInfo.countName && action != TootAction.Reply) {
                toot[actionInfo.countName] = startingCount + 1;
            } else {
                toot[actionInfo.countName] = startingCount ? (startingCount - 1) : 0;  // Avoid count going below 0
            }

            (async () => {
                try {
                    const selected = api.v1.statuses.$select(await toot.resolveID());

                    if (action == TootAction.Bookmark) {
                        await (newState ? selected.bookmark() : selected.unbookmark());
                    } else if (action == TootAction.Favourite) {
                        await (newState ? selected.favourite() : selected.unfavourite());
                    } else if (action == TootAction.Reblog) {
                        await (newState ? selected.reblog() : selected.unreblog());
                    } else {
                        throw new Error(`Unknown action: ${action}`);
                    }

                    logger.log(`Successfully changed ${action} bool to ${newState}`);
                } catch (error) {
                    // If there's an error, roll back the change to the original state
                    setCurrentState(startingState);
                    toot[actionInfo.booleanName as TootBoolean] = startingState;
                    let errorMsg = "";

                    if (actionInfo.countName) {
                        toot[actionInfo.countName] = startingCount;
                        errorMsg = `Resetting count to ${startingCount}`
                    }

                    logAndShowError(error, newState, errorMsg);
                }
            })();
        };
    };

    const performAccountAction = () => {
        return () => {
            (async () => {
                const confirmTxt = `Are you sure you want to ${label.toLowerCase()}?`;
                if (!(await confirm(confirmTxt))) return;

                const startingState = !!toot.account[actionInfo.booleanName];
                const newState = !startingState;
                logger.log(`${action}() account (startingState: ${startingState}): `, toot);
                // Optimistically update the GUI (we will reset to original state if the server call fails later)
                toot.account[actionInfo.booleanName] = newState;
                setCurrentState(newState);

                try {
                    const resolvedToot = await toot.resolve();
                    const selected = api.v1.accounts.$select(resolvedToot.account.id);

                    if (action == AccountAction.Follow) {
                        await (newState ? selected.follow() : selected.unfollow());
                    } else if (action == AccountAction.Mute) {
                        await (newState ? selected.mute() : selected.unmute());
                        await algorithm.refreshMutedAccounts();
                    } else {
                        throw new Error(`Unknown action: ${action}`);
                    }

                    logger.log(`Successfully changed ${action} bool to ${newState}`);
                } catch (error) {
                    // If there's an error, roll back the change to the original state
                    setCurrentState(startingState);
                    toot.account[actionInfo.booleanName] = startingState;
                    logAndShowError(error, newState, `Resetting state to ${startingState}.`);
                }
            })();
        };
    };

    // The user will see an entirely generated message. If you want to add something to the logs put it in 'args'.
    const logAndShowError = (error?: Error, desiredState?: boolean, ...args: any[]) => {
        const actionMsg = (desiredState === false ? "un" : "") + action.toString();
        let msg = `Failed to ${actionMsg} `;
        let note = error?.message.includes(NETWORK_ERROR) ? undefined : OAUTH_ERROR_MSG;

        if (isAccountAction(action)) {
            msg += toot.account.displayNameFullHTML(config.theme.defaultFontSize);
        } else {
            msg = msg + "toot";
        }

        logAndSetFormattedError({ args, logger, msg: msg + '!', errorObj: error, note });
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
    fontSize: 18,
    height: "23.142857px",
    lineHeight: "18px",
    width: "auto",
};
