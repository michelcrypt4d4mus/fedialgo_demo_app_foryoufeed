/*
 * Navigation helpers for React components.
 */
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { CSSProperties, MouseEvent, ReactElement, useCallback, useMemo } from "react";

import { logMsg } from "./log_helpers";
import { Toot, type TrendingWithHistory } from "fedialgo";

export const isProduction = process.env.NODE_ENV === 'production';


////////////////////////
// Navigation Helpers //
////////////////////////

// Opens in new tab. For same tab do this:  window.location.href = statusURL;
export function followUri(uri: string, e: React.MouseEvent): boolean {
    e.preventDefault();
    window.open(uri, '_blank');
    return false;
};

// Open the Toot in a new tab, resolved to its URL on the user's home server
export async function openToot(toot: Toot, e: React.MouseEvent): Promise<boolean> {
    e.preventDefault();
    logMsg("openToot() called with:", toot);
    const resolvedURL = await toot.homeserverURL();
    return followUri(resolvedURL, e);
};

// Open the url property of a TrendingLink or TagWithUsageCounts
export function openTrendingLink(obj: TrendingWithHistory, e: MouseEvent): boolean {
    return followUri(obj.url, e);
};


///////////////////////
// Component Helpers //
///////////////////////

// Create a grid of 3 or 2 columns based on the number of elements.
// Bootstrap Row/Col system margin and padding info: https://getbootstrap.com/docs/5.1/utilities/spacing/
export function gridify(elements: ReactElement[]): ReactElement {
    if (!elements || elements.length === 0) return <></>;
    const numCols = elements.length > 10 ? 3 : 2;

    const columns = elements.reduce((cols, element, i) => {
        const colIndex = i % numCols;
        cols[colIndex] ??= [];
        cols[colIndex].push(element);
        return cols;
    }, [] as ReactElement[][]);

    return (
        <Row>
            {columns.map((col, i) => <Col className="px-1" key={i}>{col}</Col>)}
        </Row>
    );
};
