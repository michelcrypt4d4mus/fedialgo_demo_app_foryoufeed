/*
 * React component to display polls, mostly ripped from poll.tsx in Mastodon repo
 */
import React, { KeyboardEventHandler, useCallback, useMemo, useState } from 'react';

import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { mastodon } from 'masto';

import { debugMsg, errorMsg } from '../../helpers/string_helpers';
import { isAccessTokenRevokedError, timeString } from 'fedialgo';
import { useAlgorithm } from '../../hooks/useAlgorithm';

const ALREADY_VOTED_MSG = `You have already voted`;

interface PollProps {
    poll: mastodon.v1.Poll,
};


export default function Poll(props: PollProps) {
    const { poll } = props;
    const { api, setError } = useAlgorithm();

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
        debugMsg(`Poll option ${choiceIndex} changed, prev selected state:`, selected);

        if (poll.multiple) {
            setSelected((prev) => ({...prev, [choiceIndex]: !prev[choiceIndex]}));
        } else {
            setSelected({[choiceIndex]: true});
        }
    };

    const vote = async () => {
        const choiceIndexes = Object.keys(selected).filter((k) => selected[k]).map((n) => parseInt(n));
        debugMsg('Vote clicked, selected is:', selected, '\nchoiceIndexes is:', choiceIndexes);

        try {
            await api.v1.polls.$select(poll.id).votes.create({choices: choiceIndexes});
            debugMsg('Vote successful, selected:', selected, '\nchoiceIndexes:', choiceIndexes);
            choiceIndexes.forEach((i) => poll.options[i].votesCount = (poll.options[i].votesCount || 0) + 1);
            poll.voted = true;
            poll.ownVotes = choiceIndexes;
            poll.votersCount = (poll.votersCount || 0) + 1;
            poll.votesCount = (poll.votesCount || 0) + choiceIndexes.length;
            setRevealed(true);
            setHasVoted(true);
        } catch (error) {
            errorMsg('Error voting:', error);

            if (isAccessTokenRevokedError(error)) {
                setError('Your access token has been revoked. Please logout and back in again.');
            } else if (error.message.includes(ALREADY_VOTED_MSG)) {
                setError('You have already voted in this poll.');
            } else {
                setError(`Error voting!\n${error.message}`);
            }
        }
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
                            debugMsg('See results clicked, current selected:', selected);
                            setRevealed(!revealed);
                        }}>
                            {revealed ? 'Hide' : 'See'} Results
                        </button>{' '}
                        ·{' '}
                    </>}

                {/* {showResults && !disabled && (
                    <>
                        <button className='poll__link' onClick={() => console.log('Refresh clicked, current selected:', selected)}>
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
