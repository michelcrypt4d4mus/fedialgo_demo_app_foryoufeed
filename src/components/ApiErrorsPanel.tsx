/*
 * The footer that appears on the login screen.
 */
import React, { CSSProperties } from "react";
import Accordion from "react-bootstrap/esm/Accordion";

import { verticalContainer } from "../helpers/style_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";


export default function ApiErrorsPanel() {
    const { algorithm } = useAlgorithm();

    if (!algorithm?.apiErrorMsgs || (algorithm.apiErrorMsgs.length === 0)) {
        return null;
    }

    return (
        <Accordion style={accordionStyle}>
            <Accordion.Item eventKey="0">
                <Accordion.Header className="error-accordion-header">
                    {algorithm.apiErrorMsgs.length} non-fatal warnings encountered while loading data
                </Accordion.Header>

                <Accordion.Body className="error-accordion-header">
                    <ul style={errorList}>
                        {algorithm.apiErrorMsgs.map((msg, i) => (
                            <li key={`${msg}_${i}`} style={errorItem}>
                                {msg}
                            </li>
                        ))}
                    </ul>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    )
};


const accordionStyle: CSSProperties = {
    ...verticalContainer,
    backgroundColor: "#3a3b3aff",
    marginRight: "100px",
};

const bottomRefSpacer: CSSProperties = {
    marginTop: "10px",
};

const errorItem: CSSProperties = {
    ...bottomRefSpacer,
    color: "#c6d000ff",
    fontSize: 12,
    marginTop: "2px",
};

const errorList: CSSProperties = {
    listStyle: "numeric",
    paddingLeft: "25px",
};
