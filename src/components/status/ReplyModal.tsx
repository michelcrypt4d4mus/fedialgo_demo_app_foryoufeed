/*
 * Modal to display JSON data.
 * React Bootstrap Modal: https://getbootstrap.com/docs/5.0/components/modal/
 */
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import React, { CSSProperties, useCallback, useEffect } from 'react';
import { Modal } from 'react-bootstrap';

import Dropzone from 'react-dropzone'
import { Toot } from 'fedialgo';

import MultimediaNode from './MultimediaNode';
import StatusComponent from './Status';
import { FEED_BACKGROUND_COLOR } from '../../helpers/style_helpers';
import { errorMsg, logMsg } from '../../helpers/string_helpers';
import { FakeToot, ModalProps } from '../../types';
import { useAlgorithm } from '../../hooks/useAlgorithm';
import { useError } from '../helpers/ErrorHandler';

const ACCEPT_ATTACHMENTS = {
    'audio/*': ['.mp3', '.wav'],
    'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    'video/*': ['.mp4', '.webm'],
};

const LOG_PREFIX = `<ReplyModal>`;
const MAX_ATTACHMENTS = 4;

const error = (msg: string, ...args: any[]) => errorMsg(`${LOG_PREFIX} ${msg}`, ...args);
const log = (msg: string, ...args: any[]) => logMsg(`${LOG_PREFIX} ${msg}`, ...args);

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

    const logAndSetError = (msg: string, err: Error) => {
        error(`${msg}`, err);
        setError(`${msg}: ${err.message}`);
    }

    useEffect(() => {
        if (show) {
            log(`useEffect (show=${show}, resolvedID=${resolvedID})`, toot);

            toot.resolveID().then(id => setResolvedID(id)).catch(err => {
                error(`Error resolving toot ID: ${err}`);
                setResolvedID(toot.id);
            });
        }
    }, [api, show])

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        log(`Accepted files:`, acceptedFiles);

        if (acceptedFiles.length + mediaAttachments.length > MAX_ATTACHMENTS) {
            const msg = `No more than 4 files! Currently attached: ${mediaAttachments.length}, adding ${acceptedFiles.length}`;
            error(msg);
            setError(msg);
            return;
        }

        acceptedFiles.forEach((file) => {
            const reader = new FileReader()
            reader.onabort = () => error('file reading was aborted')
            reader.onerror = () => error('file reading has failed')

            reader.onload = () => {
                log(`File read successfully:`, file.name, `size:`, file.size, `type:`, file.type);
                const binaryStr = reader.result

                api.v2.media.create({file: new Blob([binaryStr as ArrayBuffer], {type: file.type})})
                    .then(media => {
                        log(`Media uploaded successfully:`, media);
                        setMediaAttachments(prev => [...prev, media]);
                    })
                    .catch(err => {
                        logAndSetError(`Failed to upload media "${file.name}"`, err);
                    });
            }

            reader.readAsArrayBuffer(file)
        })

    }, []);

    const submitReply = async () => {
        if (!resolvedID) {
            setError("Failed to resolve toot ID to reply to!");
            return;
        } else if (!replyText.length) {
            setError("Reply text cannot be empty!");
            return;
        }

        log(`Submitting reply to toot ID: ${resolvedID}, text: ${replyText}`);
        const mediaIDs = mediaAttachments.map(m => m.id);

        api.v1.statuses.create({inReplyToId: resolvedID, mediaIds: mediaIDs, status: replyText})
            .then(() => {
                log(`Reply submitted successfully!`);
                setShow(false);
            }).catch(err => {
                logAndSetError(`Failed to submit reply`, err);
            });
    };

    return (
        <Modal dialogClassName={"modal-lg"} onHide={() => setShow(false)} show={show}>
            <Modal.Header closeButton style={textStyle}>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body style={{color: "black", paddingLeft: "15px", paddingRight: "15px"}}>
                <StatusComponent fontColor="black" hideLinkPreviews={true} status={toot}/>

                <Form.Group className="mb-3" style={{}}>
                    <Form.Control
                        as="textarea"
                        onChange={(e) => setReplyText(e.target.value)}
                        // placeholder='Type your reply here...'
                        rows={4}
                        style={formStyle}
                    />

                    <Dropzone onDrop={onDrop} accept={ACCEPT_ATTACHMENTS}>
                        {({getRootProps, getInputProps}) => (
                            <section>
                                <div {...getRootProps()} style={dropzoneStyle}>
                                    <input {...getInputProps()} />
                                    <p>Drag 'n' drop some files here, or click to select files</p>
                                </div>
                            </section>
                        )}
                    </Dropzone>

                    <Button onClick={() => submitReply()} style={{marginTop: "8px"}} variant="primary">
                        Submit Reply
                    </Button>
                </Form.Group>

                {mediaAttachments.length > 0 &&
                    <MultimediaNode
                        setMediaInspectionIdx={() => {}}  // No media inspection in reply modal
                        status={{
                            audioAttachments: [],
                            imageAttachments: mediaAttachments,
                            mediaAttachments: mediaAttachments,
                            videoAttachments: [],
                        } as FakeToot}
                    />}
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
    height: "60px",
    marginTop: "5px",
    padding: "20px",
    textAlign: "center",
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
