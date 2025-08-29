/*
 * Generic omponent to display a set of filter options with a switchbar at the top.
 */
import React, { CSSProperties, PropsWithChildren } from "react";

import Accordion from "react-bootstrap/esm/Accordion";
import Form from "react-bootstrap/esm/Form";
import { capitalCase } from "change-case";

import { accordionBody, globalFont } from "../../helpers/style_helpers";
import { hasAnyCapitalLetters } from "../../helpers/string_helpers";

export interface SubAccordionProps extends PropsWithChildren {
    description?: string,
    isActive?: boolean,
    title: string;
};


export default function SubAccordion(props: SubAccordionProps) {
    const { description, isActive, title } = props;
    const headerClass = `filterHeader ${isActive ? "filterHeader--active" : ""}`;

    return (
        <Accordion.Item eventKey={title} key={title}>
            <Accordion.Header>
                <Form.Label style={subHeaderLabel}>
                    <span className={headerClass} key={1}>
                        {/* // TODO janky workaround bc capitalCase() turns apostrophes into spaces */}
                        {hasAnyCapitalLetters(title) ? title : capitalCase(title)}
                    </span>

                    {description && <span style={descriptionStyle} key={2}>{'  '}({description})</span>}
                </Form.Label>
            </Accordion.Header>

            <Accordion.Body style={accordionBodyDiv}>
                {props.children}
            </Accordion.Body>
        </Accordion.Item>
    );
};


const accordionBodyDiv: CSSProperties = {
    ...accordionBody,
    paddingTop: "7px",
};

const descriptionStyle: CSSProperties = {
    ...globalFont,
    fontSize: 13,
    fontWeight: 500,
};

const subHeaderLabel: CSSProperties = {
    // color: "#2c2e2d",
    marginBottom: "-5px",
    marginTop: "-5px"
};
