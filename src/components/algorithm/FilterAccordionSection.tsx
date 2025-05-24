/*
 * Generic omponent to display a set of filter options with a switchbar at the top.
 */
import React, { CSSProperties, ReactElement } from "react";

import Form from 'react-bootstrap/esm/Form';

import SubAccordion, { SubAccordionProps } from "../helpers/SubAccordion";
import { roundedBox } from "../../helpers/style_helpers";

interface FilterAccordionSectionProps extends SubAccordionProps {
    switchbar: ReactElement[],
};


export default function FilterAccordionSection(props: FilterAccordionSectionProps) {
    const { switchbar } = props;

    return (
        <SubAccordion {...props}>
            {/* Top bar with invert/sort/etc. switches */}
            <div style={switchesContainer} key={"filterSwitchContainer"}>
                {switchbar}
            </div>

            <div style={filterSwitchContainer} key={"filter_accordionBody"}>
                <Form.Group className="mb-1">
                    <Form.Group className="mb-1">
                        {props.children}
                    </Form.Group>
                </Form.Group>
            </div>
        </SubAccordion>
    );
};


const filterSwitchContainer: CSSProperties = {
    ...roundedBox,
    paddingTop: "10px",
    paddingBottom: "5px",
    paddingRight: "15px",
};

const switchesContainer: CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    fontSize: '16px',
    fontWeight: "bold",
    height: "25px",
    justifyContent: 'space-around',
    marginBottom: '3px',
};
