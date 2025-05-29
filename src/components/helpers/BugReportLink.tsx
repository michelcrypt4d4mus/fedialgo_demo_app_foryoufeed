/*
 * Simple component for links that open in a new tab.
 */

import { CSSProperties } from "react";

import { config } from "../../config";


export default function BugReportLink() {
    return <>
        Report bugs: <a href={config.app.developerMastodonUrl} style={bugsLink} target="_blank">
            {config.app.developerMastodonUrl.split('/').pop()}
        </a>
    </>;
};


const bugsLink: CSSProperties = {
    color: "lightgrey",
    textDecoration: "none",
};
