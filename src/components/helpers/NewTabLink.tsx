/*
 * Simple component for links that open in a new tab.
 */

import React, { CSSProperties, PropsWithChildren, ReactElement } from "react";

interface NewTabLinkProps extends PropsWithChildren {
    className?: string;
    href: string;
    style?: CSSProperties;
};


export default function NewTabLink(props: NewTabLinkProps): ReactElement {
    const { children, className, href } = props;
    const style = props.style || {};

    return (
        <a
            className={className || "no_specified_class"}
            href={href}
            rel="noreferrer"
            style={style}
            target="_blank"
        >
            {children}
        </a>
    );
};
