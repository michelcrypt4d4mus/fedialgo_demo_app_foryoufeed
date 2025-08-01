/*
 * Component to display multimedia content (images, videos, audios) in a single pane.
 */
import React, { CSSProperties, useCallback, useState } from "react";
import CloseButton from 'react-bootstrap/CloseButton';

import 'react-lazy-load-image-component/src/effects/blur.css';  // For blur effect
import { GIFV, MediaCategory, Toot } from "fedialgo";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { mastodon } from 'masto';

import AttachmentsModal from "./AttachmentsModal";
import { config } from "../../config";
import { getLogger } from "../../helpers/log_helpers";
import { isEmptyStr } from "../../helpers/string_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

// TODO: what is this for? It came from pkreissel's original implementation
const GALLERY_CLASS = `media-gallery__preview`;
const HIDDEN_CANVAS = <canvas className={`${GALLERY_CLASS} ${GALLERY_CLASS}--hidden`} height="32" width="32"/>;
const VIDEO_HEIGHT = Math.floor(config.toots.imageHeight * 1.7);

const logger = getLogger("MultimediaNode");

// Either toot or mediaAttachments must be given
// If toot is not given the image is not clickable to display the modal
interface MultimediaNodeProps {
    mediaAttachments?: mastodon.v1.MediaAttachment[];
    removeMediaAttachment?: (mediaID: string) => void;
    toot?: Toot;
};


export default function MultimediaNode(props: MultimediaNodeProps): React.ReactElement {
    const { mediaAttachments, removeMediaAttachment, toot } = props;
    const { hideSensitive } = useAlgorithm();
    const hasSpoilerText = !isEmptyStr(toot?.spoilerText);
    const [mediaInspectionIdx, setMediaInspectionIdx] = useState<number>(-1);

    const showContent = hideSensitive ? !hasSpoilerText : true;
    const filterStyle = {filter: showContent ? "none" : "blur(1.5rem)"};
    const spoilerText = hasSpoilerText ? `Click to view sensitive content (${toot.spoilerText})` : "";
    let audios: mastodon.v1.MediaAttachment[];
    let images: mastodon.v1.MediaAttachment[];
    let videos: mastodon.v1.MediaAttachment[];
    let imageHeight = config.toots.imageHeight;

    if (toot) {
        audios = toot.audioAttachments;
        images = toot.imageAttachments;
        videos = toot.videoAttachments;
    } else if (mediaAttachments) {
        audios = mediaAttachments.filter(m => m.type == MediaCategory.AUDIO);
        images = mediaAttachments.filter(m => m.type == MediaCategory.IMAGE);
        videos = mediaAttachments.filter(m => m.type == MediaCategory.VIDEO);
    } else {
        logger.error("Called without mediaAttachments or status", props);
        return <></>;
    }

    const hasImageAttachments = images.length > 0;

    // If there's one image try to show it full size; If there's more than one use old image handler.
    if (images.length == 1 ) {
        imageHeight = images[0].meta?.small?.height || config.toots.imageHeight;
    } else {
        imageHeight = Math.min(
            config.toots.imageHeight,
            ...images.map(i => i.meta?.small?.height || config.toots.imageHeight)
        );
    }

    // Make a LazyLoadImage element for displaying an image within a Toot.
    const makeImage = useCallback(
        (image: mastodon.v1.MediaAttachment, idx: number): React.ReactElement => (
            <div
                className="media-gallery__item"
                key={image.previewUrl}
                style={{
                    height: "100%",
                    inset: "auto",
                    width: 1 / images.length * 100 + "%"
                }}
            >
                {HIDDEN_CANVAS}
                {removeMediaAttachment && <CloseButton onClick={() => removeMediaAttachment(image.id)}/>}

                <LazyLoadImage
                    alt={showContent ? image.description : spoilerText}
                    effect="blur"
                    onClick={() => {
                        if (removeMediaAttachment) return;  // Don't open modal if removing media
                        logger.debug(`Opening modal for idx=${idx}, hasImageAttachments=${hasImageAttachments}`);
                        setMediaInspectionIdx(idx);
                    }}
                    src={image.previewUrl}
                    style={{
                        ...filterStyle,
                        ...imageStyle,
                        cursor: removeMediaAttachment ? "default" : "pointer",
                    }}
                    title={showContent ? image.description : spoilerText}
                    wrapperProps={{style: {position: "static"}}}  // Required to center properly with blur
                />
            </div>
        ),
        [hasImageAttachments, hasSpoilerText, hideSensitive, images, removeMediaAttachment, setMediaInspectionIdx]
    );

    if (images.length > 0) {
        return (<>
            {toot &&
                <AttachmentsModal
                    mediaInspectionIdx={mediaInspectionIdx}
                    setMediaInspectionIdx={setMediaInspectionIdx}
                    toot={toot}
                />}

            <div className="media-gallery" style={{height: images.length > 1 ? '100%' : `${imageHeight}px`, ...style}}>
                {images.map((image, i) => makeImage(image, i))}
            </div>
        </>);
    } else if (videos.length > 0) {
        return (
            <div className="media-gallery" style={{height: `${VIDEO_HEIGHT}px`, ...style}}>
                {videos.map((video, i) => {
                    const sourceTag = <source src={video?.remoteUrl || video?.url} type="video/mp4" />;
                    const videoStyle = {...filterStyle, ...videoEmbedStyle};
                    let videoTag: React.ReactElement;

                    // GIFs autoplay play in a loop; mp4s are controlled by the user.
                    if (video.type == GIFV) {
                        videoTag = (
                            <video autoPlay height={"100%"} loop playsInline style={videoStyle}>
                                {sourceTag}
                            </video>
                        );
                    } else {
                        videoTag = (
                            <video controls height={"100%"} playsInline style={videoStyle}>
                                {sourceTag}
                            </video>
                        );
                    }

                    return (
                        <div className="media-gallery__item" key={i} style={videoContainer}>
                            {HIDDEN_CANVAS}
                            {videoTag}
                        </div>
                    );
                })}
            </div>
        );
    } else if (audios.length > 0) {
        return (
            <div className="media-gallery" style={{height: `${imageHeight / 4}px`, ...style}}>
                <audio controls style={{ width: "100%" }}>
                    <source src={audios[0].remoteUrl} type="audio/mpeg" />
                </audio>
            </div>
        );
    } else {
        logger.warn(`Unknown media type for status:`, toot, `\nmediaAttachments:`, mediaAttachments);
    }
};


const fullSize: CSSProperties = {
    height: "100%",
    width: "100%",
};

const mediaItem: CSSProperties = {
    backgroundColor: "black",
    borderRadius: "15px",
};

const imageStyle: CSSProperties = {
    ...fullSize,
    ...mediaItem,
    // failed attempt at fake border
    // filter: "drop-shadow(0 -5px 0 gray) drop-shadow(0 5px 0 gray) drop-shadow(-5px 0 0 gray) drop-shadow(5px 0 0 gray)",
    objectFit: "contain",
    objectPosition: "top",
};

const style: CSSProperties = {
    overflow: "hidden"
};

const videoContainer: CSSProperties = {
    ...fullSize,
    ...mediaItem,
    inset: "auto",
};

const videoEmbedStyle: CSSProperties = {
    display: "block",
    margin: "auto",
    marginLeft: "auto",
    marginRight: "auto",
};
