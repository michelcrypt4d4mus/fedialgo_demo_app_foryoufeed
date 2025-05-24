import React, { CSSProperties} from "react";

import 'react-lazy-load-image-component/src/effects/blur.css';  // For blur effect
import { GIFV, Toot } from "fedialgo";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { mastodon } from 'masto';

import { warnMsg } from "../../helpers/string_helpers";

const IMAGES_HEIGHT = 314;
const VIDEO_HEIGHT = Math.floor(IMAGES_HEIGHT * 1.7);
// TODO: what is this for?
const HIDDEN_CANVAS = <canvas className="media-gallery__preview media-gallery__preview--hidden" height="32" width="32"/>;

interface MultimediaNodeProps {
    status: Toot;
    setMediaInspectionIdx: (idx: number) => void;
};


export default function MultimediaNode(props: MultimediaNodeProps): React.ReactElement {
    const { status, setMediaInspectionIdx } = props;
    const images = status.imageAttachments;
    let imageHeight = IMAGES_HEIGHT;

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
                    width: 1 / status.mediaAttachments.length * 100 + "%"
                }}
            >
                {HIDDEN_CANVAS}

                <LazyLoadImage
                    alt={image.description}
                    effect="blur"
                    onClick={() => setMediaInspectionIdx(idx)}
                    src={image.previewUrl}
                    style={imageStyle}
                    title={image.description}
                    wrapperProps={{style: {position: "static"}}}  // Required to center properly with blur
                />
            </div>
        );
    };

    if (status.imageAttachments.length > 0) {
        return (
            <div className="media-gallery" style={{height: images.length > 1 ? '100%' : `${imageHeight}px`, ...style}}>
                {status.imageAttachments.map((image, i) => makeImage(image, i))}
            </div>
        );
    } else if (status.videoAttachments.length > 0) {
        return (
            <div className="media-gallery" style={{height: `${VIDEO_HEIGHT}px`, ...style}}>
                {status.videoAttachments.map((video, i) => {
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
    } else if (status.audioAttachments.length > 0) {
        return (
            <div className="media-gallery" style={{height: `${imageHeight / 4}px`, ...style}}>
                <audio controls style={{ width: "100%" }}>
                    <source src={status.audioAttachments[0].remoteUrl} type="audio/mpeg" />
                </audio>
            </div>
        );
    } else {
        warnMsg(`Unknown media type for status: ${status.uri}`, status);
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
    cursor: "pointer",
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
