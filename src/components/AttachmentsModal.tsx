/*
 * Modal that allows for inspection of tooted images etc upon clicking.
 */
import parse from 'html-react-parser';
import React from 'react';

import { IMAGE, VIDEO_TYPES } from 'fedialgo/dist/helpers';
import { Modal } from 'react-bootstrap';
import { Toot } from "fedialgo";


export default function AttachmentsModal(
    {
        mediaInspectionModalIdx,
        setMediaInspectionModalIdx,
        toot
    }: {
        mediaInspectionModalIdx: number,
        setMediaInspectionModalIdx: (mediaInspectionModalIdx: number) => void,
        toot: Toot
    }
) {
    const media = toot.mediaAttachments[mediaInspectionModalIdx];
    const shouldShowModal = mediaInspectionModalIdx >= 0;
    let element: JSX.Element = <></>;

    if (media?.type == IMAGE) {
        element = (
            <img
                alt={media?.description ?? ""}
                src={media?.url}
                width={"100%"}
            />
        );
    } else if (VIDEO_TYPES.includes(media?.type)) {
        element = (
            <video width={"100%"} controls>
                <source src={media?.url} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        );
    }

    return (
        <Modal
            fullscreen={'xxl-down'}
            onHide={() => setMediaInspectionModalIdx(-1)}
            show={shouldShowModal}
            size={'lg'}
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    {parse(toot.content)[100]}         {/* TODO: WTF? */}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {shouldShowModal && <div>{element}</div>}
            </Modal.Body>
        </Modal>
    );
};
