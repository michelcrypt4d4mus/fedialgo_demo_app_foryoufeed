/*
 * Modal to display JSON data.
 * React Bootstrap Modal: https://getbootstrap.com/docs/5.0/components/modal/
 */
import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Modal } from 'react-bootstrap';

import { Toot, optionalSuffix } from 'fedialgo';
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

const replyLogger = getLogger('ReplyModal');

interface ReplyModalProps extends ModalProps {
    toot?: Toot;
};


export default function ReplyModal(props: ReplyModalProps) {
    const { show, setShow, toot } = props;
    const { api, serverInfo } = useAlgorithm();
    const { logAndSetFormattedError } = useError();
    const logger = replyLogger.tempLogger(toot ? `Reply to ${toot.account.description}` : 'Create New Toot');

    // Server configuration stuff
    const acceptedAttachments = serverInfo?.mimeExtensions || config.replies.defaultAcceptedAttachments;
    const attachmentsConfig = serverInfo?.configuration?.mediaAttachments;
    const statusConfig = serverInfo?.configuration?.statuses;
    const maxChars = statusConfig?.maxCharacters || config.replies.defaultMaxCharacters;
    const maxMediaAttachments = statusConfig?.maxMediaAttachments || config.replies.defaultMaxAttachments;
    const maxImageSize = attachmentsConfig?.imageSizeLimit || config.replies.defaultMaxImageSize;
    const maxVideoSize = attachmentsConfig?.videoSizeLimit || config.replies.defaultMaxVideoSize;

    // State
    const mentionsStr = toot ? toot.replyMentions.join(' ') : '';
    const [isAttaching, setIsAttaching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mediaAttachments, setMediaAttachments] = React.useState<Toot["mediaAttachments"]>([]);
    const [replyText, setReplyText] = React.useState<string>(mentionsStr.length ? mentionsStr + '\n\n' : '');
    // null means we don't need a resolved ID, undefined means we are waiting for it to resolve
    const [resolvedID, setResolvedID] = React.useState<string | null | undefined>(toot ? undefined : null);

    // Variables
    const currentReplyLen = replyText.replace(mentionsStr, '').trim().length;
    const hasReply = ((currentReplyLen + mediaAttachments.length) > 0);
    const isResolved = !!(resolvedID || !toot);
    const isSubmitEnabled = hasReply && isResolved && !isAttaching && !isSubmitting;
    const cursor = (isAttaching || isSubmitting) ? 'wait' : 'default';
    const textareaRef = useRef(null);

    const removeMediaAttachment = (mediaID: string) => {
        logger.log(`Removing media attachment with ID: ${mediaID}`);
        setMediaAttachments(prev => prev.filter(m => m.id !== mediaID));
    };

    // Resolve the toot ID if we are replying to an existing toot
    useEffect(() => {
        if (!show || isResolved) return;
        logger.log(`Resolving toot ID for`, toot);

        toot.resolveID()
            .then(id => setResolvedID(id))
            .catch(err => handleError(`Resolve toot failed on ${serverInfo?.title}!`, `Can't reply right now.`, err));
    }, [api, show, toot])

    // Place the initial cursor at the end of the textarea
    useEffect(() => {
        if (!(show && textareaRef.current)) return;
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
        textareaRef.current.focus();
    }, [show]);

    // Drop zone stuff from the react-dropzone template
    const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]): Promise<void> => {
        logger.log(`Processing files:`, acceptedFiles);

        if (fileRejections.length > 0) {
            return handleError(`Invalid file type!`, fileRejections[0]?.errors[0]?.message);
        } else if ((acceptedFiles.length + mediaAttachments.length) > maxMediaAttachments) {
            return handleError(`No more than ${maxMediaAttachments} files can be attached!`);
        } else if (acceptedFiles.some(f => f.type.startsWith('image/') && f.size > maxImageSize)) {
            return handleError(`Image file size exceeds ${maxImageSize / 1048576} MB limit!`);
        } else if (acceptedFiles.some(f => f.type.startsWith('video/') && f.size > maxVideoSize)) {
            return handleError(`Video file size exceeds ${maxVideoSize / 1048576} MB limit!`);
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

    // Actually submit the new Status object to the server
    const createToot = async (): Promise<void> => {
        if (!isResolved) {
            return handleError("Failed to resolve toot ID to reply to!");
        } else if (!hasReply) {
            return handleError("Reply cannot be empty!");
        } else if (replyText.length > maxChars) {
            return handleError(
                `Reply text exceeds maximum length of ${maxChars} characters!`,
                `Current length: ${replyText.length}`,
            );
        } else if (isSubmitting) {
            return handleError("Already submitting a reply! Please wait until it finishes.");
        }

        setIsSubmitting(true);

        const createStatusParams = {
            inReplyToId: resolvedID,
            mediaIds: mediaAttachments.map(m => m.id),
            status: replyText.trim()
        };

        logger.log(`Creating toot with params:`, createStatusParams);

        api.v1.statuses.create(createStatusParams)
            .then((response) => {
                logger.log(`Reply submitted successfully! Response:`, response);
                setShow(false);
            }).catch(err => {
                handleError(`Failed to submit reply`, null, err);
            }).finally(() => {
                setIsSubmitting(false);
                setReplyText(mentionsStr);  // Reset the reply text
                setMediaAttachments([]);  // Clear media attachments
                setResolvedID(null);  // Reset resolved ID
            });
    };

    const handleError = (msg: string, note?: string, errorObj?: Error) => {
        const errorArgs: Record<string, string | any> = { resolvedID, statusConfig };
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
                <p>{toot ? `Reply to ${toot.account.description}` : `Create New Toot`}</p>
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
                        placeholder={'Your thoughts go here...'}
                        ref={textareaRef}
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
                            disabled={!isSubmitEnabled}
                            onClick={createToot}
                            style={buttonStyle}
                        >
                            {isAttaching
                                ? `Attaching...`
                                : (resolvedID === undefined)
                                    ? 'Resolving toot ID...'
                                    : `Submit${optionalSuffix(toot, 'Reply')}`}
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
