/*
 * Simple component for links that open in a new tab.
 */

import React, { CSSProperties, PropsWithChildren, ReactElement } from "react";

interface NewTabLinkProps extends PropsWithChildren {
    className?: string;
    href: string;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
    style?: CSSProperties;
};


export default function NewTabLink(props: NewTabLinkProps): ReactElement {
    const { children, className, href, onClick } = props;
    const style = props.style || {};

    return (
        <a
            className={className || "no_specified_class"}
            href={href}
            onClick={(e) => {
                if (onClick) {
                    onClick(e);
                }
            }}
            rel="noreferrer"
            style={style}
            target="_blank"
        >
            {children}
        </a>
    );
};
