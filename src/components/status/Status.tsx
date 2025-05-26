/*
 * Render a Status, also known as a Toot.
 */
import React, { CSSProperties, useEffect, useRef, useState } from "react";

import parse from 'html-react-parser';
// import Toast from 'react-bootstrap/Toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Toot } from "fedialgo";
import {
    IconDefinition,
    faBolt,
    faCheckCircle,
    faFireFlameCurved,
    faHashtag,
    faLink,
    faLock,
    faPencil,
    faReply,
    faRetweet,
    faRobot,
    faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";

import ActionButton, { AccountAction, ButtonAction, TootAction } from "./ActionButton";
import JsonModal from '../helpers/JsonModal';
import MultimediaNode from "./MultimediaNode";
import NewTabLink from '../helpers/NewTabLink';
import Poll from "./Poll";
import PreviewCard from "./PreviewCard";
import ReplyModal from "./ReplyModal";
import useOnScreen from "../../hooks/useOnScreen";
import { debugMsg, errorMsg, logMsg, logSafe, timestampString } from '../../helpers/string_helpers';
import { FOLLOWED_TAG_COLOR, PARTICIPATED_TAG_COLOR, TRENDING_TAG_COLOR, linkesque } from "../../helpers/style_helpers";
import { formatScore, formatScores } from "../../helpers/number_helpers";
import { openToot } from "../../helpers/react_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

export const TOOLTIP_ACCOUNT_ANCHOR = "user-account-anchor";

type IconInfo = {
    icon: IconDefinition,
    color?: string,
};

enum InfoIconType {
    Bot = "Bot Account",
    DM = "Direct Message",
    Edited = "Edited",
    Hashtags = "Hashtags",
    Mention = "You're Mentioned",
    Reply = "Reply",
    ShowToot = "Show Raw Toot JSON",
    TrendingLink = "Contains Trending Link",
    TrendingToot = "Trending Toot",
};

const INFO_ICONS: Record<InfoIconType, IconInfo> = {
    [InfoIconType.Bot]:          {icon: faRobot, color: "#196273"},
    [InfoIconType.DM]:           {icon: faLock, color: "purple"},
    [InfoIconType.Edited]:       {icon: faPencil},
    [InfoIconType.Hashtags]:     {icon: faHashtag, color: PARTICIPATED_TAG_COLOR},
    [InfoIconType.Mention]:      {icon: faBolt, color: "green"},
    [InfoIconType.Reply]:        {icon: faReply, color: "blue"},
    [InfoIconType.ShowToot]:     {icon: faUpRightFromSquare},
    [InfoIconType.TrendingLink]: {icon: faLink, color: TRENDING_TAG_COLOR},
    [InfoIconType.TrendingToot]: {icon: faFireFlameCurved, color: TRENDING_TAG_COLOR},
};

interface StatusComponentProps {
    fontColor?: CSSProperties["color"],
    hideLinkPreviews?: boolean,
    isLoadingThread?: boolean,
    setIsLoadingThread?: (isLoading: boolean) => void,
    setThread?: (toots: Toot[]) => void,
    status: Toot,
};


export default function StatusComponent(props: StatusComponentProps) {
    const { fontColor, hideLinkPreviews, isLoadingThread, setIsLoadingThread, setThread, status } = props;
    const { isLoading } = useAlgorithm();
    const fontStyle = fontColor ? { color: fontColor } : {};
    const contentClass = fontColor ? "status__content__alt" : "status__content";
    const statusRef = useRef<HTMLDivElement>(null);
    const isOnScreen = useOnScreen(statusRef);

    // If it's a retoot set 'toot' to the original toot
    const toot = status.realToot();
    const hasAttachments = toot.mediaAttachments.length > 0;
    const isReblog = toot.reblogsBy.length > 0;
    const ariaLabel = `${toot.account.displayName}, ${toot.account.note} ${toot.account.webfingerURI}`;

    // idx of the mediaAttachment to show in the media inspection modal (-1 means no modal)
    const [showReplyModal, setShowReplyModal] = React.useState<boolean>(false);
    const [showScoreModal, setShowScoreModal] = React.useState<boolean>(false);
    const [showTootModal, setShowTootModal] = React.useState<boolean>(false);

    // useEffect to handle things we want to do when the toot makes its first appearnace on screen
    useEffect(() => {
        if (isLoading || !isOnScreen) return;

        // Pre-emptively resolve the toot ID as it appears on screen to speed up future interactions
        toot.resolveID().catch((e) => errorMsg(`Error resolving toot ID: ${toot.describe()}`, e));
        toot.numTimesShown = (toot.numTimesShown || 0) + 1;
    }, [isLoading, isOnScreen])

    // Build the account link(s) for the reblogger(s) that appears at top of a retoot
    const rebloggersLinks = (
        <span>
            {toot.reblogsBy.map((account, i) => {
                const rebloggerLink = (
                    <NewTabLink className="status__display-name muted" href={account.homserverURL()} key={i}>
                        <bdi><strong>
                            {parse(account.displayNameWithEmojis())}
                        </strong></bdi>
                    </NewTabLink>
                );

                return i < (toot.reblogsBy.length - 1) ? [rebloggerLink, ', '] : rebloggerLink;
            })} retooted
        </span>
    );

    // Construct a colored font awesome icon to indicate some kind of property of the toot
    const infoIcon = (iconType: InfoIconType): React.ReactElement => {
        const iconInfo = INFO_ICONS[iconType];
        let title = iconType as string;
        let color = iconInfo.color;

        if (iconType == InfoIconType.Edited) {
            title += ` ${timestampString(toot.editedAt)}`;
        } else if (iconType == InfoIconType.Hashtags) {
            title = toot.containsTagsMsg();

            if (toot.followedTags?.length) {
                color = FOLLOWED_TAG_COLOR;
            } else if (toot.trendingTags?.length) {
                color = TRENDING_TAG_COLOR;
            }
        }

        return <FontAwesomeIcon
            icon={iconInfo.icon}
            style={color ? {...baseIconStyle, color: color} : baseIconStyle}
            title={title}
        />;
    };

    // Build an action button (reply, reblog, fave, etc) that appears at the bottom of a toot
    const buildActionButton = (action: ButtonAction, onClick?: (e: React.MouseEvent) => void) => {
        return <ActionButton action={action} onClick={onClick} setThread={setThread} toot={toot} />;
    };

    return (
        <div>
            <JsonModal
                infoTxt="Scoring categories where the unweighted score is zero are not shown."
                json={toot.scoreInfo ? formatScores(toot.scoreInfo) as object : {}}
                jsonViewProps={{
                    collapsed: 3,
                    name: "toot.scoreInfo",
                    style: {fontSize: 16},
                }}
                show={showScoreModal}
                setShow={setShowScoreModal}
                subtitle={<ul>
                    <li>{'Poster:'} <span style={{fontWeight: 500}}>{parse(toot.account.displayNameFullHTML())}</span></li>
                    <li>{'Final Score:'} <code>{formatScore(toot.scoreInfo.score)}</code></li>
                </ul>}
                title="This Toot's Score"
            />

            <JsonModal
                dialogClassName="modal-xl"
                json={status}
                jsonViewProps={{
                    collapsed: 1,
                    displayArrayKey: true,
                    indentWidth: 8,
                    name: "toot",
                    style: {fontSize: 13},
                    theme: "brewer",
                }}
                show={showTootModal}
                setShow={setShowTootModal}
                title="Raw Toot Object"
            />

            <ReplyModal
                toot={toot}
                setShow={setShowReplyModal}
                show={showReplyModal}
            />

            <div aria-label={ariaLabel} className="status__wrapper status__wrapper-public focusable">
                {/* Names of accounts that reblogged the toot (if any) */}
                {isReblog &&
                    <div className="status__prepend">
                        <div className="status__prepend-icon-wrapper">
                            <FontAwesomeIcon className="status__prepend-icon fa-fw" icon={faRetweet} />
                        </div>

                        {rebloggersLinks}
                    </div>}

                <div className="status" style={isReblog ? { paddingTop: "10px" } : {}}>
                    {/* Top bar with account and info icons */}
                    <div className="status__info">
                        {/* Top right icons + timestamp that link to the toot */}
                        <div className="status__relative-time" style={{display: "inline-block"}}>
                            <NewTabLink className="status__relative-time-icons" href={toot.uri} onClick={(e) => openToot(toot, e)}>
                                <span className="status__visibility-icon">
                                    {toot.editedAt && infoIcon(InfoIconType.Edited)}
                                    {toot.inReplyToAccountId && infoIcon(InfoIconType.Reply)}
                                    {toot.trendingRank > 0 && infoIcon(InfoIconType.TrendingToot)}
                                    {toot.trendingLinks.length > 0 && infoIcon(InfoIconType.TrendingLink)}
                                    {toot.containsUserMention() && infoIcon(InfoIconType.Mention)}
                                    {toot.containsTagsMsg() && infoIcon(InfoIconType.Hashtags)}
                                    {toot.isDM() && infoIcon(InfoIconType.DM)}
                                    {toot.account.bot && infoIcon(InfoIconType.Bot)}
                                </span>

                                <time dateTime={toot.createdAt} title={toot.createdAt}>
                                    {timestampString(toot.createdAt)}
                                </time>
                            </NewTabLink>

                            <span onClick={(e) => {e.preventDefault(); setShowTootModal(true)}} style={openJSON}>
                                {infoIcon(InfoIconType.ShowToot)}
                            </span>
                        </div>


                        {/* Account name + avatar */}
                        <div title={toot.account.webfingerURI} className="status__display-name">
                            <a
                                data-tooltip-id={TOOLTIP_ACCOUNT_ANCHOR}
                                data-tooltip-html={toot.account.noteWithAccountInfo()}
                            >
                                <div className="status__avatar">
                                    <div className="account__avatar" style={{height: "46px", width: "46px"}}>
                                        <LazyLoadImage src={toot.account.avatar} alt={`${toot.account.webfingerURI}`} />
                                    </div>
                                </div>
                            </a>

                            <span className="display-name">
                                <bdi>
                                    <strong key="internalBDI" className="display-name__html">
                                        <NewTabLink
                                            href={toot.account.homserverURL()}
                                            style={{...accountLink, ...fontStyle}}
                                        >
                                            {parse(toot.account.displayNameWithEmojis())}
                                        </NewTabLink>

                                        {toot.account.fields.filter(f => f.verifiedAt).map((f, i) => (
                                            <span
                                                className="verified-badge"
                                                key={`${f.name}_${i}`}
                                                style={{color: "lightblue", padding: "0px 5px"}}
                                                title={f.value.replace(/<[^>]*>?/gm, '')}
                                            >
                                                <FontAwesomeIcon aria-hidden="true" icon={faCheckCircle} />
                                            </span>
                                        ))}
                                    </strong>
                                </bdi>

                                <span key="acctdisplay" className="display-name__account">
                                    @{toot.account.webfingerURI}
                                    <span style={{width: "5px"}}>{' '}</span>
                                    {buildActionButton(AccountAction.Follow)}
                                    {buildActionButton(AccountAction.Mute)}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Text content of the toot */}
                    <div className={contentClass} style={fontStyle}>
                        <div className="status__content__text status__content__text--visible translate" lang="en">
                            {parse(toot.contentNonTagsParagraphs())}
                        </div>
                    </div>

                    {/* Preview card and attachment display */}
                    {toot.card && !hasAttachments && <PreviewCard card={toot.card} hideLinkPreviews={hideLinkPreviews} />}
                    {hasAttachments && <MultimediaNode toot={toot}/>}
                    {toot.poll && <Poll poll={toot.poll} />}

                    {/* Tags in smaller font, if they make up the entirety of the last paragraph */}
                    {toot.contentTagsParagraph() &&
                        <div className={contentClass} style={{paddingTop: "12px"}}>
                            <span style={tagFontStyle}>{parse(toot.contentTagsParagraph())}</span>
                        </div>}

                    {setThread && ((toot.repliesCount > 0) || !!toot.inReplyToAccountId) &&
                        <p style={{paddingTop: "8px"}}>
                            <a
                                onClick={() => {
                                    console.debug(`setIsLoadingThread for toot: ${toot.describe()}`);
                                    setIsLoadingThread(true);
                                    toot.getConversation().then(toots => setThread(toots)).finally(() => setIsLoadingThread(false));
                                }}
                                style={{color: "grey", cursor: isLoadingThread ? 'wait' : 'pointer', fontSize: "11px"}}
                            >
                                ⇇ View the Thread
                            </a>
                        </p>}

                    {/* Actions (retoot, favorite, show score, etc) that appear in bottom panel of toot */}
                    <div className="status__action-bar" ref={statusRef}>
                        {buildActionButton(TootAction.Reply, (e: React.MouseEvent) => setShowReplyModal(true))}
                        {buildActionButton(TootAction.Reblog)}
                        {buildActionButton(TootAction.Favourite)}
                        {buildActionButton(TootAction.Bookmark)}
                        {buildActionButton(TootAction.Score, () => setShowScoreModal(true))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const accountLink: CSSProperties = {
    color: "white",
    textDecoration: "none"
};

const baseIconStyle: CSSProperties = {
    marginRight: "3px",
};

const openJSON: CSSProperties = {
    cursor: "pointer",
    marginLeft: "10px"
};

// TODO: this probably doesn't do anything because the <a> tag overrides it
const tagFontStyle: CSSProperties = {
    color: "#636f7a",
    fontSize: 13,
};
