/*
 * Component to display multimedia content (images, videos, audios) in a single pane.
 */
import React, { CSSProperties } from "react";
import CloseButton from 'react-bootstrap/CloseButton';

import 'react-lazy-load-image-component/src/effects/blur.css';  // For blur effect
import { GIFV, MediaCategory, Toot } from "fedialgo";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { mastodon } from 'masto';

import AttachmentsModal from "./AttachmentsModal";
import { debugMsg, errorMsg, warnMsg } from "../../helpers/string_helpers";

// TODO: what is this for? It came from pkreissel's original implementation
const GALLERY_CLASS = `media-gallery__preview`;
const HIDDEN_CANVAS = <canvas className={`${GALLERY_CLASS} ${GALLERY_CLASS}--hidden`} height="32" width="32"/>;
const IMAGES_HEIGHT = 314;
const VIDEO_HEIGHT = Math.floor(IMAGES_HEIGHT * 1.7);

// Either toot or mediaAttachments must be given
// If removeMediaAttachment is given, don't show the modal on clicking an image
interface MultimediaNodeProps {
    mediaAttachments?: mastodon.v1.MediaAttachment[];
    removeMediaAttachment?: (mediaID: string) => void;
    toot?: Toot;
};


export default function MultimediaNode(props: MultimediaNodeProps): React.ReactElement {
    const { mediaAttachments, removeMediaAttachment, toot } = props;
    const [mediaInspectionIdx, setMediaInspectionIdx] = React.useState<number>(-1);
    const hasImageAttachments = toot.imageAttachments.length > 0;
    let audios: mastodon.v1.MediaAttachment[];
    let images: mastodon.v1.MediaAttachment[];
    let videos: mastodon.v1.MediaAttachment[];
    let imageHeight = IMAGES_HEIGHT;

    if (toot) {
        audios = toot.audioAttachments;
        images = toot.imageAttachments;
        videos = toot.videoAttachments;
    } else if (mediaAttachments) {
        audios = mediaAttachments.filter(m => m.type == MediaCategory.AUDIO);
        images = mediaAttachments.filter(m => m.type == MediaCategory.IMAGE);
        videos = mediaAttachments.filter(m => m.type == MediaCategory.VIDEO);
    } else {
        errorMsg("MultimediaNode called without mediaAttachments or status", props);
        return <></>;
    }

    // If there's one image try to show it full size; If there's more than one use old image handler.
    if (images.length == 1 ) {
        imageHeight = images[0].meta?.small?.height || IMAGES_HEIGHT;
    } else {
        imageHeight = Math.min(IMAGES_HEIGHT, ...images.map(i => i.meta?.small?.height || IMAGES_HEIGHT));
    }

    // Make a LazyLoadImage element for displaying an image within a Toot.
    const makeImage = (image: mastodon.v1.MediaAttachment, idx: number): React.ReactElement => {
        return (
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
                    alt={image.description}
                    effect="blur"
                    onClick={() => {
                        if (removeMediaAttachment) return;  // Don't open modal if removing media
                        debugMsg(`Opening media inspection modal for idx=${idx}, hasImageAttachments=${hasImageAttachments}`);
                        setMediaInspectionIdx(idx);
                    }}
                    src={image.previewUrl}
                    style={{...imageStyle, cursor: removeMediaAttachment ? "default" : "pointer"}}
                    title={image.description}
                    wrapperProps={{style: {position: "static"}}}  // Required to center properly with blur
                />
            </div>
        );
    };

    if (images.length > 0) {
        return (<>
            {!removeMediaAttachment &&
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
                    let videoTag: React.ReactElement;

                    // GIFs autoplay play in a loop; mp4s are controlled by the user.
                    if (video.type == GIFV) {
                        videoTag = (
                            <video autoPlay height={"100%"} loop playsInline style={videoEmbedStyle}>
                                {sourceTag}
                            </video>
                        );
                    } else {
                        videoTag = (
                            <video controls height={"100%"} playsInline style={videoEmbedStyle}>
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
        warnMsg(`Unknown media type for status:`, toot, `\nmediaAttachments:`, mediaAttachments);
    }
};


const fullSize: CSSProperties = {
    height: "100%",
    width: "100%",
};

const mediaItem: CSSProperties = {
    backgroundColor: "black", // IMAGE_BACKGROUND_COLOR,
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
