/*
 * Modal to display JSON data.
 * React Bootstrap Modal: https://getbootstrap.com/docs/5.0/components/modal/
 */
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import React, { CSSProperties, useEffect } from 'react';
import { Modal } from 'react-bootstrap';

import Dropzone from 'react-dropzone'
import { Toot } from 'fedialgo';

import StatusComponent from './Status';
import { FEED_BACKGROUND_COLOR } from '../../helpers/style_helpers';
import { ModalProps } from '../../types';
import { useAlgorithm } from '../../hooks/useAlgorithm';
import { useError } from '../helpers/ErrorHandler';

interface ReplyModalProps extends ModalProps {
    toot: Toot;
};


export default function ReplyModal(props: ReplyModalProps) {
    const { show, setShow, title, toot } = props;
    const { api } = useAlgorithm();
    const { setError } = useError();

    const [mediaAttachments, setMediaAttachments] = React.useState<Toot["mediaAttachments"]>([]);
    const [replyText, setReplyText] = React.useState<string>("");
    const [resolvedID, setResolvedID] = React.useState<string | null>(null);

    useEffect(() => {
        if (show) {
            console.log(`ReplyModal useEffect (show=${show}, resolvedID=${resolvedID})`, toot);

            toot.resolveID().then(id => setResolvedID(id)).catch(err => {
                console.error(`Error resolving toot ID: ${err}`);
                setResolvedID(toot.id);
            });
        }
    }, [api, show])

    const submitReply = async () => {
        if (!resolvedID) {
            setError("Failed to resolve toot ID to reply to!");
            return;
        } else if (!replyText.length) {
            setError("Reply text cannot be empty!");
            return;
        }

        console.log(`Submitting reply to toot ID: ${resolvedID}, text: ${replyText}`);

        api.v1.statuses.create({inReplyToId: resolvedID, status: replyText})
            .then(() => {
                console.log(`Reply submitted successfully!`);
                setShow(false);
            }).catch(err => {
                console.error(`Error submitting reply: ${err}`);
                setError(`Failed to submit reply: ${err.message}`);
            });
    }

    return (
        <Modal
            dialogClassName={"modal-lg"}
            onHide={() => setShow(false)}
            show={show}
        >
            <Modal.Header closeButton style={textStyle}>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body style={{color: "black", paddingLeft: "15px", paddingRight: "15px"}}>
                <StatusComponent fontColor="black" hideLinkPreviews={true} status={toot}/>

                <Form.Group className="mb-3" style={{}}>
                    <Form.Control
                        as="textarea"
                        onChange={(e) => setReplyText(e.target.value)}
                        // placeh
                        // older='Type your reply here...'
                        rows={4}
                        style={formStyle}
                    />

                    <Button onClick={() => submitReply()} style={{marginTop: "8px"}} variant="primary">
                        Submit Reply
                    </Button>
                </Form.Group>

                <Dropzone onDrop={acceptedFiles => console.log(`Accepted files:`, acceptedFiles)}>
                    {({getRootProps, getInputProps}) => (
                        <section>
                            <div {...getRootProps()} style={dropzoneStyle}>
                                <input {...getInputProps()} />
                                <p>Drag 'n' drop some files here, or click to select files</p>
                            </div>
                        </section>
                    )}
                </Dropzone>
            </Modal.Body>
        </Modal>
    );
};


const buttonStyle: CSSProperties = {
    marginBottom: "5px",
    marginRight: "10px",
    marginTop: "-10px",
};

const charStyle: CSSProperties = {
    backgroundColor: FEED_BACKGROUND_COLOR,
    borderRadius: "15px",
};

const dropzoneStyle: CSSProperties = {
    backgroundColor: "grey",
    borderRadius: "15px",
    height: "100px",
    padding: "20px",
    width: "100%",
};

const formStyle: CSSProperties = {
    backgroundColor: FEED_BACKGROUND_COLOR,
    color: "white",
    marginTop: "15px",
};

const textStyle: CSSProperties = {
    color: "black",
};
