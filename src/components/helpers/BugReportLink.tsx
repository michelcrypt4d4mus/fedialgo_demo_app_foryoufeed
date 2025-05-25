/*
 * Simple component for links that open in a new tab.
 */

import React, { CSSProperties } from "react";

import { CRYPTADAMUS_MASTODON_URL } from "../../helpers/string_helpers";

export const BUG_REPORT_LABEL = `@cryptadamist`;
export const BUG_REPORT_WEBFINGER_URI = `${BUG_REPORT_LABEL}@universeodon.com`;;


export default function BugReportLink() {
    return <>
        Feedback/bug reports: <a href={CRYPTADAMUS_MASTODON_URL} style={bugsLink} target="_blank">
            {BUG_REPORT_LABEL}
        </a>
    </>;
};


const bugsLink: CSSProperties = {
    color: "lightgrey",
    textDecoration: "none",
};
