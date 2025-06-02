/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, PropsWithChildren } from "react";
import Accordion from 'react-bootstrap/esm/Accordion';

import { accordionBody, noPadding, titleStyle } from "../../helpers/style_helpers";

interface TopLevelAccordionProps extends PropsWithChildren {
    bodyStyle?: CSSProperties,
    isActive?: boolean,
    onExited?: () => void,
    startOpen?: boolean,
    title: string,
};


export default function TopLevelAccordion(props: TopLevelAccordionProps) {
    const { bodyStyle, isActive, onExited, startOpen, title } = props;

    // Invert color scheme of title if active
    const className = isActive ? "filterHeader--rounded" : "";
    const style = {...titleStyle, color: isActive ? "white" : "black"};

    return (
        <Accordion defaultActiveKey={startOpen ? title : null}>
            <Accordion.Item eventKey={title}>
                <Accordion.Header style={noPadding}>
                    <span className={className} style={style}>
                        {title}
                    </span>
                </Accordion.Header>

                <Accordion.Body onExited={onExited} style={{...accordionBody, ...(bodyStyle || {})}}>
                    {props.children}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};
