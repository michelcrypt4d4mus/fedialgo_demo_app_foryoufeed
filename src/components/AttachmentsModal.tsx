/*
 * Modal that allows for inspection of tooted images etc upon clicking.
 */
import parse from 'html-react-parser';
import React from 'react';

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

    return (
        <Modal
            fullscreen={'xxl-down'}
            onHide={() => setMediaInspectionModalIdx(-1)}
            show={mediaInspectionModalIdx != -1}
            size='lg'
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    {parse(toot.content)[100]}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {(mediaInspectionModalIdx != -1) &&
                    <div>
                        {media?.type === "image" &&
                            <img
                                alt={media?.description ?? ""}
                                src={media?.url}
                                width={"100%"}
                            />}

                        {media?.type === "video" &&
                            <video width={"100%"} controls>
                                <source src={media?.url} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>}
                    </div>}
            </Modal.Body>
        </Modal>
    );
};
