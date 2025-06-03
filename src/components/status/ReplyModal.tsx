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
import { config } from '../../config';
import { fileInfo, isEmptyStr } from '../../helpers/string_helpers';
import { getLogger } from '../../helpers/log_helpers';
import { ModalProps } from '../../types';
import { OAUTH_ERROR_MSG } from '../experimental/ExperimentalFeatures';
import { useAlgorithm } from '../../hooks/useAlgorithm';
import { useError } from '../helpers/ErrorHandler';

const logger = getLogger('ReplyModal');

interface ReplyModalProps extends ModalProps {
    toot?: Toot;
};


export default function ReplyModal(props: ReplyModalProps) {
    const { show, setShow, toot } = props;
    const { api, mimeExtensions, serverInfo } = useAlgorithm();
    const { logAndSetFormattedError } = useError();

    // Server configuration stuff
    const acceptedAttachments = mimeExtensions || config.replies.defaultAcceptedAttachments;
    const statusConfig = serverInfo?.configuration?.statuses;
    const maxChars = statusConfig?.maxCharacters || config.replies.defaultMaxCharacters;
    const maxMediaAttachments = statusConfig?.maxMediaAttachments || config.replies.defaultMaxAttachments;
    const attachmentsConfig = serverInfo?.configuration?.mediaAttachments;
    const maxImageSize = attachmentsConfig?.imageSizeLimit || config.replies.defaultMaxImageSize;
    const maxVideoSize = attachmentsConfig?.videoSizeLimit || config.replies.defaultMaxVideoSize;

    // State
    const replyMentionsStr = toot ? (toot.replyMentions().join(' ') + '\n\n') : '';
    const [isAttaching, setIsAttaching] = useState(false);
    const [mediaAttachments, setMediaAttachments] = React.useState<Toot["mediaAttachments"]>([]);
    const [replyText, setReplyText] = React.useState<string>(replyMentionsStr);
    // null means we don't need a resolved ID, undefined means we are waiting for it to resolve
    const [resolvedID, setResolvedID] = React.useState<string | null | undefined>(toot ? undefined : null);

    const cursor = isAttaching ? 'wait' : 'default';
    const currentReplyLen = () => replyText.replace(replyMentionsStr, '').trim().length;

    const removeMediaAttachment = (mediaID: string) => {
        logger.log(`Removing media attachment with ID: ${mediaID}`);
        setMediaAttachments(prev => prev.filter(m => m.id !== mediaID));
    };

    useEffect(() => {
        if (!toot) return;

        if (show && !resolvedID) {
            logger.log(`Resolving toot ID for`, toot);

            toot.resolveID()
                .then(id => setResolvedID(id))
                .catch(err => {
                    handleError(`Failed to resolve toot on ${serverInfo?.title}!`, `Can't reply right now.`, err);
                });
        }
    }, [api, show])

    const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
        logger.log(`Processing files:`, acceptedFiles);

        if (fileRejections.length > 0) {
            handleError(`Invalid file type!`, fileRejections[0]?.errors[0]?.message);
            return;
        } else if ((acceptedFiles.length + mediaAttachments.length) > maxMediaAttachments) {
            handleError(`No more than ${maxMediaAttachments} files can be attached!`);
            return;
        } else if (acceptedFiles.some(f => f.type.startsWith('image/') && f.size > maxImageSize)) {
            handleError(`Image file size exceeds ${maxImageSize / 1048576} MB limit!`);
            return;
        } else if (acceptedFiles.some(f => f.type.startsWith('video/') && f.size > maxVideoSize)) {
            handleError(`Video file size exceeds ${maxVideoSize / 1048576} MB limit!`);
            return;
        }

        setIsAttaching(true);

        acceptedFiles.forEach((file) => {
            logger.log(`Processing ${fileInfo(file)}. File:`, file);
            const reader = new FileReader();
            reader.onabort = () => handleError('File reading aborted', null, new Error(`File read aborted on ${file.name}`));
            reader.onerror = () => handleError('File reading failed!', null, new Error(`File read failed on ${file.name}`));

            reader.onload = () => {
                logger.log(`Uploading file (${fileInfo(file)})`);

                api.v2.media.create({file: new Blob([reader.result as ArrayBuffer], {type: file.type})})
                    .then(media => {
                        logger.log(`Media uploaded successfully:`, media);
                        setMediaAttachments(prev => [...prev, media]);
                    })
                    .catch(err => {
                        handleError(
                            `Failed to upload media "${file.name}" (${file.type}).`,
                            // TODO: this is a janky way to avoid putting OAUTH_ERROR_MSG in every error message
                            !err.message.includes("Error processing thumbnail") ? OAUTH_ERROR_MSG : null,
                            err
                        );
                    })
                    .finally(() => {
                        setIsAttaching(false); // TODO: this sets isAttaching to false after one upload which is not ideal
                    });
            }

            reader.readAsArrayBuffer(file);  // Must be called to actually process the file!
        });
    }, []);

    const { getInputProps, getRootProps, isDragActive } = useDropzone({onDrop, accept: acceptedAttachments});

    const createToot = async () => {
        if (toot && !resolvedID) {
            handleError("Failed to resolve toot ID to reply to!");
            return;
        } else if ((replyText.length + mediaAttachments.length) == 0) {
            handleError("Reply cannot be empty!");
            return;
        } else if (replyText.length > maxChars) {
            handleError(
                `Reply text exceeds maximum length of ${maxChars} characters!`,
                `Current length: ${replyText.length}`,
            );

            return;
        }

        const mediaIDs = mediaAttachments.map(m => m.id);
        logger.log(`Submitting toot (replying to "${resolvedID}", text: "${replyText.trim()}", mediaIDs:`, mediaIDs);

        api.v1.statuses.create({inReplyToId: resolvedID, mediaIds: mediaIDs, status: replyText.trim()})
            .then(() => {
                logger.log(`Reply submitted successfully!`);
                setShow(false);
            }).catch(err => {
                handleError(`Failed to submit reply`, null, err);
            });
    };

    const handleError = (msg: string, note?: string, errorObj?: Error) => {
        let errorArgs: Record<string, string | any> = { resolvedID, statusConfig };
        if (mediaAttachments.length) errorArgs.mediaAttachments = mediaAttachments;
        if (!isEmptyStr(replyText)) errorArgs.replyText = replyText;
        logAndSetFormattedError({errorObj, logger, msg, note, args: errorArgs});
    };

    return (
        <Modal
            dialogClassName={"modal-lg"}
            onHide={() => setShow(false)}
            show={show}
            style={{cursor: cursor}}
        >
            <Modal.Header closeButton style={headerStyle}>
                <p>
                    {toot ? `Reply to {toot.account.describe()` : `Create a new toot`}
                </p>
            </Modal.Header>

            <Modal.Body style={{color: "black", paddingLeft: "25px", paddingRight: "25px"}}>
                {toot &&
                    <div style={{backgroundColor: config.theme.feedBackgroundColor, borderRadius: "3px"}}>
                        <StatusComponent hideLinkPreviews={true} status={toot}/>
                    </div>}

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
                            disabled={isAttaching || currentReplyLen() == 0 || resolvedID === undefined}
                            onClick={() => createToot()} style={buttonStyle}
                        >
                            {isAttaching
                                ? `Attaching...`
                                : (resolvedID === undefined)
                                    ? 'Resolving toot ID...'
                                    : `Submit` + (toot ? ` Reply` : '')}
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
