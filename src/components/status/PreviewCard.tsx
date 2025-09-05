/*
 * React component to display preview cards for links.
 * https://docs.joinmastodon.org/entities/PreviewCard/
 */
import React, { CSSProperties } from "react";

import NewTabLink from "../helpers/NewTabLink";
import parse from "html-react-parser";
import { extractDomain } from "fedialgo";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { mastodon } from "masto";

import { config } from "../../config";

interface PreviewCardProps {
    card: mastodon.v1.PreviewCard;
    showLinkPreviews: boolean;
};


export default function PreviewCard(props: PreviewCardProps): React.ReactElement {
    const { card, showLinkPreviews } = props;
    const altText = card.title || card.description;

    const headline = <>
        <span style={providerName}>[{card.providerName || extractDomain(card.url)}]</span>{' '}
        <span>{parse(card.title)}</span>
    </>;

    // If link previews are disabled just return a link with the headline
    if (!showLinkPreviews) {
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
                    alt={altText}
                    className="status-card__image-image"
                    src={card.image}
                    style={cardImage}
                    title={altText}
                />
            </div>

            <div className='status-card__content'>
                {headline}

                <p className='status-card__description' style={{marginTop: "2px"}}>
                    {card.description.slice(0, config.toots.maxPreviewCardLength)}
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

const linkOnlyStyle: CSSProperties = {
    paddingBottom: "6px",
    paddingTop: "6px",
    paddingLeft: "10px",
    paddingRight: "10px",
    textDecoration: "underline"
};
