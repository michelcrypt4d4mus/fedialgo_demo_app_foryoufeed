/*
 * Modal to display JSON data.
 * React Bootstrap Modal: https://getbootstrap.com/docs/5.0/components/modal/
 */
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import React, { CSSProperties, useEffect } from 'react';
import { Modal } from 'react-bootstrap';

import { mastodon } from 'masto';
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
    let { dialogClassName, show, setShow, title, toot } = props;
    const { api } = useAlgorithm();
    const { setError } = useError();

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
            dialogClassName={dialogClassName || "modal-xl"}
            onHide={() => setShow(false)}
            show={show}
        >
            <Modal.Header closeButton style={textStyle}>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body >
                <StatusComponent fontColor="black" status={toot}/>

                <Form>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                        <Form.Label>Example textarea</Form.Label>

                        <Form.Control
                            as="textarea"
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={4}
                            style={formStyle}
                        />

                        <Button onClick={() => submitReply()} variant="primary">
                            Submit
                        </Button>
                    </Form.Group>
                </Form>
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

const formStyle: CSSProperties = {
    backgroundColor: FEED_BACKGROUND_COLOR,
    color: "white",
    // borderRadius: "15px",
};

const textStyle: CSSProperties = {
    color: "black",
};
