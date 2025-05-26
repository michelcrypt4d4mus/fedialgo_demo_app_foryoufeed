/*
 * Modal that allows for inspection of tooted images etc upon clicking.
 */
import React from 'react';
import { Modal } from 'react-bootstrap';

import { MediaCategory, Toot, VIDEO_TYPES } from "fedialgo";

interface AttachmentsModalProps {
    mediaInspectionIdx: number;
    setMediaInspectionIdx: (mediaInspectionIdx: number) => void;
    toot: Toot;
};


export default function AttachmentsModal(props: AttachmentsModalProps) {
    const { mediaInspectionIdx, setMediaInspectionIdx, toot } = props;
    const shouldShowModal = mediaInspectionIdx >= 0;
    let element: JSX.Element = <></>;
    console.log(`AttachmentsModal: mediaInspectionIdx=${mediaInspectionIdx}, toot=${toot.id}, shouldShowModal=${shouldShowModal}`);

    if (shouldShowModal) {
        const media = toot.mediaAttachments[mediaInspectionIdx];

        if (!media?.url) {
            console.warn(`[AttachmentsModal] Invalid media.url at idx ${mediaInspectionIdx}. toot:`, toot);
        } else if (media.type == MediaCategory.IMAGE) {
            element = <img alt={media.description ?? ""} src={media.url} width={"100%"} />;
        } else if (VIDEO_TYPES.includes(media.type)) {
            element = (
                <video width={"100%"} controls>
                    <source src={media.url} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            );
        } else {
            console.warn(`[AttachmentsModal] Unknown type at toot.mediaAttachments[${mediaInspectionIdx}]`, toot);
        }
    }

    return (
        <Modal
            fullscreen={'xxl-down'}
            onHide={() => setMediaInspectionIdx(-1)}
            show={shouldShowModal}
            size={'lg'}
        >
            <Modal.Header closeButton>
                <Modal.Title style={{color: "black"}}>
                    {toot.contentShortened()}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {shouldShowModal && <div>{element}</div>}
            </Modal.Body>
        </Modal>
    );
};
