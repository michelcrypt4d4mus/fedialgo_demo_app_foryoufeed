/*
 * Modal to display JSON data.
 * React Bootstrap Modal: https://getbootstrap.com/docs/5.0/components/modal/
 */
import React, { CSSProperties, useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Modal } from 'react-bootstrap';

import { Toot } from 'fedialgo';
import { useDropzone } from 'react-dropzone'

import MultimediaNode from './MultimediaNode';
import StatusComponent from './Status';
import { getLogger } from '../../helpers/log_helpers';
import { config } from '../../config';
import { fileInfo } from '../../helpers/string_helpers';
import { ModalProps } from '../../types';
import { OAUTH_ERROR_MSG } from '../experimental/ExperimentalFeatures';
import { useAlgorithm } from '../../hooks/useAlgorithm';
import { useError } from '../helpers/ErrorHandler';

const logger = getLogger('ReplyModal');

interface ReplyModalProps extends ModalProps {
    toot: Toot;
};


export default function ReplyModal(props: ReplyModalProps) {
    const { show, setShow, toot } = props;
    const { api, mimeExtensions, serverInfo } = useAlgorithm();
    const { logAndSetError, setError } = useError();

    const [isAttaching, setIsAttaching] = useState(false);
    const [mediaAttachments, setMediaAttachments] = React.useState<Toot["mediaAttachments"]>([]);
    const [replyText, setReplyText] = React.useState<string>("");
    const [resolvedID, setResolvedID] = React.useState<string | null>(null);
    const cursor = isAttaching ? 'wait' : 'default'
    const isDisabled = isAttaching || replyText.trim().length === 0 || resolvedID === null;

    // Server configuration stuff
    const acceptedAttachments = mimeExtensions || config.replies.defaultAcceptedAttachments;
    const statusConfig = serverInfo?.configuration?.statuses;
    const maxChars = statusConfig?.maxCharacters || config.replies.defaultMaxCharacters;
    const maxMediaAttachments = statusConfig?.maxMediaAttachments || config.replies.defaultMaxAttachments;
    const attachmentsConfig = serverInfo?.configuration?.mediaAttachments;
    const maxImageSize = attachmentsConfig?.imageSizeLimit || config.replies.defaultMaxImageSize;
    const maxVideoSize = attachmentsConfig?.videoSizeLimit || config.replies.defaultMaxVideoSize;

    const logError = (msg: string, err?: Error) => {
        logAndSetError(logger, msg, err);
    }

    const removeMediaAttachment = (mediaID: string) => {
        logger.log(`Removing media attachment with ID: ${mediaID}`);
        setMediaAttachments(prev => prev.filter(m => m.id !== mediaID));
    }

    useEffect(() => {
        if (show) {
            logger.log(`useEffect (show=${show}, resolvedID=${resolvedID})`, toot);

            // TODO: this sets an invalid ID if resolution fails...
            toot.resolveID().then(id => setResolvedID(id)).catch(err => {
                logger.error(`Error resolving toot ID: ${err}`);
                setResolvedID(toot.id);
            });
        }
    }, [api, show])

    const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
        logger.log(`Accepted files:`, acceptedFiles);

        if (fileRejections.length > 0) {
            logError(`Invalid file type! "${fileRejections[0].errors[0].message}"`);
            return;
        } else if ((acceptedFiles.length + mediaAttachments.length) > maxMediaAttachments) {
            logError(`No more than ${maxMediaAttachments} files can be attached!`);
            return;
        } else if (acceptedFiles.some(f => f.type.startsWith('image/') && f.size > maxImageSize)) {
            const msg = `Image file size exceeds ${maxImageSize / 1048576} MB limit!`;
            logError(msg);
            return;
        } else if (acceptedFiles.some(f => f.type.startsWith('video/') && f.size > maxVideoSize)) {
            const msg = `Video file size exceeds ${maxVideoSize / 1048576} MB limit!`;
            logError(msg);
            return;
        }

        setIsAttaching(true);

        acceptedFiles.forEach((file) => {
            logger.log(`Processing ${fileInfo(file)}. File:`, file);
            const reader = new FileReader();
            reader.onabort = () => logError('File reading was aborted');
            reader.onerror = () => logError('File reading has failed');

            reader.onload = () => {
                logger.log(`Uploading file (${fileInfo(file)})`);

                api.v2.media.create({file: new Blob([reader.result as ArrayBuffer], {type: file.type})})
                    .then(media => {
                        logger.log(`Media uploaded successfully:`, media);
                        setMediaAttachments(prev => [...prev, media]);
                    })
                    .catch(err => {
                        let msg = `Failed to upload media "${file.name}" (${file.type}).`;
                        // TODO: this is a janky way to avoid putting OAUTH_ERROR_MSG in every error message
                        if (!err.message.includes("Error processing thumbnail")) msg += ` ${OAUTH_ERROR_MSG}`;
                        logError(msg, err);
                    })
                    .finally(() => {
                        setIsAttaching(false); // TODO: this sets isAttaching to false after one upload which is not ideal
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

        const txt = toot.replyMentions().join(' ') + '\n\n' + replyText.trim();
        logger.log(`Submitting reply to toot ID: ${resolvedID}, text: ${txt}`);
        const mediaIDs = mediaAttachments.map(m => m.id);

        api.v1.statuses.create({inReplyToId: resolvedID, mediaIds: mediaIDs, status: txt})
            .then(() => {
                logger.log(`Reply submitted successfully!`);
                setShow(false);
            }).catch(err => {
                logError(`Failed to submit reply`, err);
            });
    };

    const { getInputProps, getRootProps, isDragActive } = useDropzone({onDrop, accept: acceptedAttachments});

    return (
        <Modal
            dialogClassName={"modal-lg"}
            onHide={() => setShow(false)}
            show={show}
            style={{cursor: cursor}}
        >
            <Modal.Header closeButton style={headerStyle}>
                <p>Reply to {toot.account.describe()}</p>
            </Modal.Header>

            <Modal.Body style={{color: "black", paddingLeft: "25px", paddingRight: "25px"}}>
                <div style={{backgroundColor: config.theme.feedBackgroundColor, borderRadius: "3px"}}>
                    <StatusComponent hideLinkPreviews={true} status={toot}/>
                </div>

                <Form.Group className="mb-3" style={{cursor: cursor}}>
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

                    <div
                        style={{...dropzoneStyle, cursor: isAttaching ? cursor : "pointer"}}
                        {...getRootProps({className: 'dropzone'})}
                    >
                        <input {...getInputProps()} />

                        <p style={{fontSize: "16px", fontWeight: "bold"}}>
                            {isDragActive
                                ? "Drag files here"
                                : "Drag 'n' drop files on this colored area or click to select files to attach"}
                        </p>
                    </div>

                    <div style={buttonContainer}>
                        <Button
                            className="btn-lg"
                            disabled={isDisabled}
                            onClick={() => submitReply()} style={buttonStyle}
                        >
                            {isAttaching
                                ? `Attaching...`
                                : !resolvedID
                                    ? 'Resolving toot ID...'
                                    : `Submit Reply`}
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

const buttonContainer: CSSProperties = {
    display: "flex",
    justifyContent: "space-around",
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
    backgroundColor: "white",
    borderWidth: "5px",
    color: "black",
    fontSize: "22px",
    marginTop: "13px",
};

const headerStyle: CSSProperties = {
    backgroundColor: config.theme.feedBackgroundColorLite,
    color: "black",
    fontWeight: "bold",
};
