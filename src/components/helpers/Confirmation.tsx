import * as React from 'react';

import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { ConfirmDialog, confirmable, createConfirmation } from 'react-confirm';

interface ConfirmationProps {
    okLabel?: string,
    cancelLabel?: string,
    title?: string,
    confirmation: string,
    show: boolean,
    proceed: (shouldProceed: boolean) => any, // called when ok button is clicked.
    enableEscape?: boolean,
};


const Confirmation = (props: ConfirmationProps) => {
    const {
        okLabel = "OK",
        cancelLabel = "Cancel",
        title = "Confirmation",
        confirmation,
        show,
        proceed,
        enableEscape = true
    } = props;

    return (
        <div className="static-modal">
            <Modal
                animation={false}
                backdrop={enableEscape ? true : "static"}
                keyboard={enableEscape}
                onHide={() => proceed(false)}
                show={show}
                style={{ color: "black" }}
            >
                <Modal.Header>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>{confirmation}</Modal.Body>

                <Modal.Footer>
                    <Button onClick={() => proceed(false)}>{cancelLabel}</Button>

                    <Button
                        className="button-l"
                        variant="primary"
                        onClick={() => proceed(true)}
                    >
                        {okLabel}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};


export function confirm(
    confirmation: string,
    okLabel: string = "OK",
    cancelLabel: string = "Cancel",
    options: any = {}
) {
    return createConfirmation(confirmable(Confirmation))({
        confirmation,
        okLabel,
        cancelLabel,
        ...options
    });
};
