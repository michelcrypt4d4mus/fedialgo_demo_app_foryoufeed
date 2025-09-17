/*
 * React component to display polls, mostly ripped from poll.tsx in Mastodon repo
 */
import React, { KeyboardEventHandler, useCallback, useMemo, useState } from "react";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isAccessTokenRevokedError, timeString } from "fedialgo";
import { mastodon } from "masto";

import { getLogger } from "../../helpers/log_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";
import { useError } from "../../components/helpers/ErrorHandler";

const ALREADY_VOTED_MSG = `You have already voted`;

const logger = getLogger("Poll");

interface PollProps {
    poll: mastodon.v1.Poll,
};


export default function Poll(props: PollProps) {
    const { poll } = props;
    const { api } = useAlgorithm();
    const { logAndSetFormattedError } = useError();

    const [hasVoted, setHasVoted] = useState(poll.ownVotes?.length > 0);
    const [revealed, setRevealed] = useState(false);
    const [selected, setSelected] = useState<Record<string, boolean>>({});

    const expired = useMemo(() => {
        const expiresAt = poll.expiresAt;
        return poll.expired || new Date(expiresAt).getTime() < Date.now();
    }, [poll]);

    const timeRemaining = useMemo(() => {
        if (expired) return 'Closed';
        return `Ends ${timeString(poll.expiresAt)}`;
    }, [expired, poll]);

    const votesCount = useMemo(() => {
        const votesCount = poll.votersCount ?? poll.votesCount;
        return <span>{votesCount} {votesCount === 1 ? 'person has' : 'people have'} voted</span>;
    }, [poll]);

    const voteDisabled = expired || hasVoted || Object.values(selected).every((item) => !item);
    const showResults = poll.voted || revealed || expired || hasVoted;
    const disabled = poll.voted || expired || hasVoted || poll.ownVotes?.length > 0;

    const handleOptionChange = (choiceIndex: number) => {
        logger.debug(`Poll option ${choiceIndex} changed, prev selected state:`, selected);

        if (poll.multiple) {
            setSelected((prev) => ({...prev, [choiceIndex]: !prev[choiceIndex]}));
        } else {
            setSelected({[choiceIndex]: true});
        }
    };

    /** Submit a vote. */
    const vote = async () => {
        const choiceIndexes = Object.keys(selected).filter((k) => selected[k]).map((n) => parseInt(n));
        logger.debug('Vote clicked, selected is:', selected, '\nchoiceIndexes is:', choiceIndexes);

        try {
            await api.v1.polls.$select(poll.id).votes.create({choices: choiceIndexes});
            logger.debug('Vote successful, selected:', selected, '\nchoiceIndexes:', choiceIndexes);
            choiceIndexes.forEach((i) => poll.options[i].votesCount = (poll.options[i].votesCount || 0) + 1);
            poll.voted = true;
            poll.ownVotes = choiceIndexes;
            poll.votersCount = (poll.votersCount || 0) + 1;
            poll.votesCount = (poll.votesCount || 0) + choiceIndexes.length;
            setRevealed(true);
            setHasVoted(true);
        } catch (error) {
            console.error('Error voting:', error);

            if (isAccessTokenRevokedError(error)) {
                handleError('Your access token was revoked.', error);
            } else if (error.message.includes(ALREADY_VOTED_MSG)) {
                handleError('You have already voted in this poll.');
            } else {
                handleError(`Error voting in poll!`, error);
            }
        }
    }

    /** Deal with any errors that arise when attempting to vote in a poll. */
    const handleError = (msg: string, errorObj?: Error) => {
        logAndSetFormattedError({
            args: { poll, hasVoted, selected, choices: Object.keys(selected).filter((k) => selected[k]) },
            errorObj,
            logger,
            msg,
            note: errorObj && isAccessTokenRevokedError(errorObj) ? 'Please logout and back in again.' : null,
        });
    }

    return (
        <div className='poll'>
            <ul>
                {poll.options.map((option, i) => (
                    <PollOption
                        active={!!selected[i]}
                        index={i}
                        key={option.title || i}
                        onChange={handleOptionChange}
                        option={option}
                        poll={poll}
                        showResults={showResults}
                    />))}
            </ul>

            <div className='poll__footer'>
                {!showResults && (
                    <button
                        className='button button-secondary'
                        disabled={voteDisabled}
                        onClick={vote}
                    >
                        Vote
                    </button>)}

                {!disabled &&
                    <>
                        <button className='poll__link' onClick={() => {
                            logger.debug('See results clicked, current selected:', selected);
                            setRevealed(!revealed);
                        }}>
                            {revealed ? 'Hide' : 'See'} Results
                        </button>{' '}
                        ·{' '}
                    </>}

                {/* {showResults && !disabled && (
                    <>
                        <button className='poll__link' onClick={() => logger.log('Refresh clicked, current selected:', selected)}>
                            Refresh
                        </button>{' '}
                        ·{' '}
                    </>)} */}

                {votesCount}
                {poll.expiresAt && <> · {timeRemaining}</>}
            </div>
        </div>
    );
};


function PollOption(props) {
    const { active, lang, disabled, poll, option, index, showResults, onChange } = props;
    const voted = option.voted || poll.ownVotes?.includes(index);
    const title = option.translation?.title ?? option.title;

    // Derived values
    const percent = useMemo(() => {
        const pollVotesCount = poll.votersCount ?? poll.votesCount;
        return pollVotesCount === 0 ? 0 : (option.votesCount / pollVotesCount) * 100;
    }, [option, poll]);

    // True if this is the leading option
    const isLeading = useMemo(
        () => poll.options.filter((o) => o.title !== o.title).every((o) => o.votesCount >= o.votesCount),
        [poll, option]
    );

    // Handlers
    const handleOptionChange = useCallback(() => {
        onChange(index);
    }, [index, onChange]);

    const handleOptionKeyPress: KeyboardEventHandler = useCallback(
        (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                onChange(index);
                event.stopPropagation();
                event.preventDefault();
            }
        },
        [index, onChange],
    );

    return (
        <li>
            <label className={'poll__option' + (showResults ? '' : ' selectable')}>
                <input
                    checked={active}
                    disabled={disabled}
                    name='vote-options'
                    onChange={handleOptionChange}
                    type={poll.multiple ? 'checkbox' : 'radio'}
                    value={index}
                />

                {!showResults &&
                    <span
                        aria-checked={active}
                        aria-label={title}
                        className={`poll__input ${poll.multiple ? 'checkbox' : 'radio'} ${active ? 'active' : ''}`}
                        data-index={index}
                        lang={lang}
                        onKeyDown={handleOptionKeyPress}
                        role={poll.multiple ? 'checkbox' : 'radio'}
                        tabIndex={0}
                    />}

                {showResults &&
                    <span className='poll__number' title={`${option.votesCount} votes`}>
                        {Math.round(percent)}%
                    </span>}

                <span className='poll__option__text translate' lang={lang}>
                    {option.title}
                </span>

                {!!voted &&
                    <span className='poll__voted'>
                        {'('}
                        <FontAwesomeIcon
                            icon={faCheck}
                            style={{color: 'cyan'}}
                            title={'You voted for this answer'}
                        />
                        {')'}
                    </span>}
            </label>

            {showResults &&
                <span
                    className={`poll__chart ${isLeading ? 'leading' : ''}`}
                    style={{width: `${percent}%`}}
                />}
        </li>
    );
};
