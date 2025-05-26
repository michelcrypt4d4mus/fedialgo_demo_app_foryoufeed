/*
 * Modal to display JSON data.
 * React Bootstrap Modal: https://getbootstrap.com/docs/5.0/components/modal/
 */
import React, { CSSProperties, useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Modal } from 'react-bootstrap';

import Dropzone from 'react-dropzone'
import { Toot } from 'fedialgo';

import MultimediaNode from './MultimediaNode';
import StatusComponent from './Status';
import { errorMsg, fileInfo, logMsg } from '../../helpers/string_helpers';
import { FEED_BACKGROUND_COLOR, FEED_BACKGROUND_COLOR_LITE } from '../../helpers/style_helpers';
import { ModalProps } from '../../types';
import { OAUTH_ERROR_MSG } from '../experimental/ExperimentalFeatures';
import { useAlgorithm } from '../../hooks/useAlgorithm';
import { useError } from '../helpers/ErrorHandler';

const ACCEPT_ATTACHMENTS = {
    'audio/*': ['.mp3', '.wav'],
    'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    'video/*': ['.mp4', '.webm'],
};

const LOG_PREFIX = `<ReplyModal>`;
const DEFAULT_MAX_CHARACTERS = 500;
const DEFAULT_MAX_ATTACHMENTS = 4;
const DEFAULT_MAX_IMAGE_SIZE = 10485760; // 10 MB
const DEFAULT_MAX_VIDEO_SIZE = 41943040; // 40 MB
const MODAL_TITLE = "Reply to Toot";

const error = (msg: string, ...args: any[]) => errorMsg(`${LOG_PREFIX} ${msg}`, ...args);
const log = (msg: string, ...args: any[]) => logMsg(`${LOG_PREFIX} ${msg}`, ...args);

interface ReplyModalProps extends ModalProps {
    toot: Toot;
};


export default function ReplyModal(props: ReplyModalProps) {
    const { show, setShow, toot } = props;
    const { api, serverInfo } = useAlgorithm();
    const { setError } = useError();

    const [isAttaching, setIsAttaching] = useState(false);
    const [mediaAttachments, setMediaAttachments] = React.useState<Toot["mediaAttachments"]>([]);
    const [replyText, setReplyText] = React.useState<string>("");
    const [resolvedID, setResolvedID] = React.useState<string | null>(null);

    const statusConfig = serverInfo?.configuration?.statuses;
    const attachmentsConfig = serverInfo?.configuration?.mediaAttachments;
    const maxChars = statusConfig?.maxCharacters || DEFAULT_MAX_CHARACTERS;
    const maxMediaAttachments = statusConfig?.maxMediaAttachments || DEFAULT_MAX_ATTACHMENTS;
    const maxImageSize = attachmentsConfig?.imageSizeLimit || DEFAULT_MAX_IMAGE_SIZE;
    const maxVideoSize = attachmentsConfig?.videoSizeLimit || DEFAULT_MAX_VIDEO_SIZE;

    const logAndSetError = (msg: string, err?: Error) => {
        error(`${msg}`, err);
        setError(msg + (err ? ` (${err.message})` : ``));
    }

    const removeMediaAttachment = (mediaID: string) => {
        log(`Removing media attachment with ID: ${mediaID}`);
        setMediaAttachments(prev => prev.filter(m => m.id !== mediaID));
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

        if ((acceptedFiles.length + mediaAttachments.length) > maxMediaAttachments) {
            logAndSetError(`No more than ${maxMediaAttachments} files can be attached!`);
            return;
        } else if (acceptedFiles.some(f => f.type.startsWith('image/') && f.size > maxImageSize)) {
            const msg = `Image file size exceeds ${maxImageSize / 1048576} MB limit!`;
            logAndSetError(msg);
            return;
        } else if (acceptedFiles.some(f => f.type.startsWith('video/') && f.size > maxVideoSize)) {
            const msg = `Video file size exceeds ${maxVideoSize / 1048576} MB limit!`;
            logAndSetError(msg);
            return;
        }

        setIsAttaching(true);

        acceptedFiles.forEach((file) => {
            log(`Processing ${fileInfo(file)}. File:`, file);
            const reader = new FileReader();
            reader.onabort = () => logAndSetError('File reading was aborted');
            reader.onerror = () => logAndSetError('File reading has failed');

            reader.onload = () => {
                log(`File read successfully (${fileInfo(file)})`);

                api.v2.media.create({file: new Blob([reader.result as ArrayBuffer], {type: file.type})})
                    .then(media => {
                        log(`Media uploaded successfully:`, media);
                        setMediaAttachments(prev => [...prev, media]);
                    })
                    .catch(err => {
                        logAndSetError(`Failed to upload media "${file.name}". ${OAUTH_ERROR_MSG}`, err);
                    })
                    .finally(() => {
                        setIsAttaching(false);
                    });
            }

            reader.readAsArrayBuffer(file);  // Must be called to actually process the file!
        });
    }, []);

    const submitReply = async () => {
        if (!resolvedID) {
            setError("Failed to resolve toot ID to reply to!");
            return;
        } else if ((replyText.length + mediaAttachments.length) == 0) {
            setError("Reply cannot be empty!");
            return;
        } else if (replyText.length > maxChars) {
            setError(`Reply text exceeds maximum length of ${maxChars} characters! Current length: ${replyText.length}`);
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
        <Modal
            dialogClassName={"modal-lg"}
            onHide={() => setShow(false)}
            show={show}
            style={{cursor: isAttaching ? 'wait' : 'default'}}
        >
            <Modal.Header closeButton style={headerStyle}>
                <p>Reply to {toot.account.describe()}</p>
            </Modal.Header>

            <Modal.Body style={{color: "black", paddingLeft: "25px", paddingRight: "25px"}}>
                <div style={{backgroundColor: FEED_BACKGROUND_COLOR, borderRadius: "3px"}}>
                    <StatusComponent hideLinkPreviews={true} status={toot}/>
                </div>

                <Form.Group className="mb-3" style={{}}>
                    <Form.Control
                        as="textarea"
                        autoFocus={true}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={'Type your reply here...'}
                        rows={4}
                        style={formStyle}
                        value={replyText}
                    />

                    {mediaAttachments.length > 0 &&
                        <MultimediaNode
                            mediaAttachments={mediaAttachments}
                            removeMediaAttachment={removeMediaAttachment}
                        />}

                    <Dropzone onDrop={onDrop} accept={ACCEPT_ATTACHMENTS}>
                        {({getRootProps, getInputProps}) => (
                            <section>
                                <div {...getRootProps()} style={dropzoneStyle}>
                                    <input {...getInputProps()} />

                                    <p style={{cursor: "pointer", fontSize: "16px", fontWeight: "bold"}}>
                                        Drag 'n' drop files on this colored area or click to select files to attach
                                    </p>
                                </div>
                            </section>
                        )}
                    </Dropzone>

                    <div style={{justifyContent: "space-around", display: "flex"}}>
                        <Button className="btn-lg" onClick={() => submitReply()} style={buttonStyle}>
                            Submit Reply
                        </Button>
                    </div>
                </Form.Group>
            </Modal.Body>
        </Modal>
    );
};


const buttonStyle: CSSProperties = {
    marginTop: "20px",
};

const dropzoneStyle: CSSProperties = {
    backgroundColor: "grey",
    borderRadius: "15px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    height: "60px",
    marginTop: "12px",
    padding: "20px",
    textAlign: "center",
    width: "100%",
};

const formStyle: CSSProperties = {
    backgroundColor: "white",// FEED_BACKGROUND_COLOR_LITE,//"lightblue", // FEED_BACKGROUND_COLOR_LITE, //"lightgrey",// FEED_BACKGROUND_COLOR,
    borderWidth: "5px",
    color: "black",
    fontSize: "22px",
    marginTop: "13px",
};

const headerStyle: CSSProperties = {
    backgroundColor: FEED_BACKGROUND_COLOR_LITE,
    color: "black",
    fontWeight: "bold",
};
