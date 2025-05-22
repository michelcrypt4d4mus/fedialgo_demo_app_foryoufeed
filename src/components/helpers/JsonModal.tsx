/*
 * Modal to display JSON data.
 * React Bootstrap Modal: https://getbootstrap.com/docs/5.0/components/modal/
 */
import React, { CSSProperties, ReactNode } from 'react';
import { Modal } from 'react-bootstrap';

import ReactJsonView from '@microlink/react-json-view';

import { globalFont } from '../../helpers/style_helpers';
import { ModalProps } from '../../types';

type ReactJsonViewProps = typeof ReactJsonView.defaultProps;

// Props documentation: https://github.com/microlinkhq/react-json-view?tab=readme-ov-file#api
const DEFAULT_JSON_VIEW_PROPS: ReactJsonViewProps = {
    collapsed: 1,
    displayArrayKey: false,
    displayDataTypes: false,
    displayObjectSize: false,
    enableClipboard: false,
    quotesOnKeys: false,
    sortKeys: true,
    style: { padding: "20px" },
    theme: "rjv-default", // "apathy:inverted",
};

interface JsonModalProps extends ModalProps {
    infoTxt?: ReactNode,
    json: object,
    jsonViewProps?: ReactJsonViewProps,
};


export default function JsonModal(props: JsonModalProps) {
    let { dialogClassName, infoTxt, json, jsonViewProps, show, setShow, subtitle, title } = props;
    jsonViewProps ??= {};
    jsonViewProps.style = { ...jsonViewStyle, ...(jsonViewProps.style || {}) };
    json ??= {};

    return (
        <Modal
            dialogClassName={dialogClassName}
            onHide={() => setShow(false)}
            show={show}
        >
            <Modal.Header closeButton style={textStyle}>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body >
                {(subtitle || infoTxt) &&
                    <div style={{...textStyle, marginBottom: "5px"}}>
                        {subtitle && <div style={headerFont}>{subtitle}</div>}
                        {infoTxt && <div>{infoTxt}</div>}
                    </div>}

                <ReactJsonView
                    {...{...DEFAULT_JSON_VIEW_PROPS, ...jsonViewProps}}
                    src={json || {}}
                />
            </Modal.Body>
        </Modal>
    );
};


const textStyle: CSSProperties = {
    color: "black",
};

const headerFont: CSSProperties = {
    ...globalFont,
    ...textStyle,
    fontSize: "14px",
    fontWeight: 700,
    marginBottom: "5px",
};

const jsonViewStyle: CSSProperties = {
    borderRadius: "15px",
    padding: "20px",
};
