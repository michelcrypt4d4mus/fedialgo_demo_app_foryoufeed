/*
 * React component to display preview cards for links.
 * https://docs.joinmastodon.org/entities/PreviewCard/
 */
import React, { CSSProperties } from 'react';

import NewTabLink from '../helpers/NewTabLink';
import parse from 'html-react-parser';
import { extractDomain } from 'fedialgo';
import { LazyLoadImage } from "react-lazy-load-image-component";
import { mastodon } from 'masto';

const MAX_STATUS_CARD_LEN = 350;

interface PreviewCardProps {
    card: mastodon.v1.PreviewCard;
    hideLinkPreviews: boolean;
};


export default function PreviewCard(props: PreviewCardProps): React.ReactElement {
    const { card, hideLinkPreviews } = props;

    const headline = <>
        <span style={providerName}>
            [{card.providerName || extractDomain(card.url)}]
        </span> <span style={headlineStyle}>
            {parse(card.title)}
        </span>
    </>;

    if (hideLinkPreviews) {
        return (
            <NewTabLink className="status-card compact" href={card.url} style={linkOnlyStyle}>
                {headline}
            </NewTabLink>
        );
    }

    return (
        <NewTabLink className="status-card compact" href={card.url}>
            <div className="status-card__image">
                {/* TODO: WTF is this and do we need it? */}
                <canvas
                    className="status-card__image-preview status-card__image-preview--hidden"
                    height="32"
                    width="32"
                />

                <LazyLoadImage
                    alt={card.title || card.description}
                    className="status-card__image-image"
                    src={card.image}
                    style={cardImage}
                    title={card.title || card.description}
                />
            </div>

            <div className='status-card__content'>
                {headline}

                <p className='status-card__description' style={{marginTop: "2px"}}>
                    {card.description.slice(0, MAX_STATUS_CARD_LEN)}
                </p>
            </div>
        </NewTabLink>
    );
};


const cardImage: CSSProperties = {
    maxHeight: "40vh",
    objectPosition: "top",
};

const providerName: CSSProperties = {
    color: "#4b427a",
};

const headlineStyle: CSSProperties = {
    // fontSize: "16px",
    // fontWeight: "bold",
};

const linkOnlyStyle: CSSProperties = {
    paddingBottom: "6px",
    paddingTop: "6px",
    paddingLeft: "10px",
    paddingRight: "10px",
    textDecoration: "underline"
};
