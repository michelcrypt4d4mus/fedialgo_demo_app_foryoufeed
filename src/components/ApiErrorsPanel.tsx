/*
 * The footer that appears on the login screen when API errors and warnings were encountered
 * while retrieving Mastodon data.
 */
import React, { CSSProperties } from "react";
import Accordion from "react-bootstrap/Accordion";
import Card from 'react-bootstrap/Card';
import { useAccordionButton } from 'react-bootstrap';

import { config } from "../config";
import { useAlgorithm } from "../hooks/useAlgorithm";
import { verticalContainer } from "../helpers/style_helpers";

const ACCORDION_ITEM_KEY = "0";


export default function ApiErrorsPanel() {
    const { algorithm } = useAlgorithm();

    if (!algorithm?.apiErrorMsgs || (algorithm.apiErrorMsgs.length === 0)) {
        return null;
    }

    return (
        <Accordion style={accordionStyle}>
            <Card style={accordionStyle}>
                <Card.Header>
                    <CustomToggle eventKey={ACCORDION_ITEM_KEY}>
                        {algorithm.apiErrorMsgs.length} {config.timeline.apiErrorsUserMsgSuffix} (click to inspect)
                    </CustomToggle>
                </Card.Header>

                <Accordion.Collapse eventKey={ACCORDION_ITEM_KEY}>
                    <Card.Body className="error-accordion-header">
                        <ul style={errorList}>
                            {algorithm.apiErrorMsgs.map((msg, i) => (
                                <li key={`${msg}_${i}`} style={errorItem}>
                                    {msg}
                                </li>
                            ))}
                        </ul>
                    </Card.Body>
                </Accordion.Collapse>
            </Card>
        </Accordion>
    )
};


/**
 * Custom toggle for the accordion header. For some reason it doesn't work to directly inline the useAccordionButton.
 */
function CustomToggle({ children, eventKey }) {
    const decoratedOnClick = useAccordionButton(eventKey, () => console.debug('expand eventKey:', eventKey));

    return (
        <button type="button" style={buttonStyle} onClick={decoratedOnClick}>
            {children}
        </button>
    );
};


const accordionHeaderStyle: CSSProperties = {
    backgroundColor: "#4f4f42ff",
};

const accordionStyle: CSSProperties = {
    ...accordionHeaderStyle,
    ...verticalContainer,
    fontFamily: "Tahoma, Geneva, sans-serif",
    marginBottom: verticalContainer.marginTop,
};

const buttonStyle: CSSProperties = {
    ...accordionHeaderStyle,
    borderWidth: "0px",
    color: "#a4a477ff",
    width: '100%'
};

const errorItem: CSSProperties = {
    color: "#c6d000ff",
    fontSize: 12,
    marginTop: "2px",
};

const errorList: CSSProperties = {
    listStyle: "numeric",
    paddingLeft: "25px",
};
