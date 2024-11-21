import parse from 'html-react-parser';
import React from 'react';
import { Modal } from 'react-bootstrap';
import { StatusType } from '../types';


export const AttachmentsModal = ({ attModal, setAttModal, status }: { attModal: number, setAttModal: (attModal: number) => void, status: StatusType }) => {
    return (
        <Modal show={attModal != -1} onHide={() => setAttModal(-1)}>
            <Modal.Header closeButton>
                <Modal.Title>{parse(status.content)[100]}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {(attModal != -1) &&
                    <div>
                        {
                            status.mediaAttachments[attModal]?.type === "image" &&
                                <img
                                    alt={status.mediaAttachments[attModal]?.description ?? ""}
                                    src={status.mediaAttachments[attModal]?.url}
                                    width={"100%"}
                                />
                        }
                        {status.mediaAttachments[attModal]?.type === "video" &&
                            <video width={"100%"} controls>
                                <source src={status.mediaAttachments[attModal]?.url} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        }
                    </div>
                }
            </Modal.Body>
        </Modal>
    )
};
