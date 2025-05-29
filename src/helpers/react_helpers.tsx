/*
 * Navigation helpers for React components.
 */
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { CSSProperties, MouseEvent, ReactElement, useState } from "react";

import { makeChunks } from 'fedialgo';

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

// Build a checkbox for a boolean useState() variable
export function buildStateCheckbox(
    label: string,
    state: ReturnType<typeof useState<boolean>>,
    className?: string
) {
    return (
        <Form.Check
            checked={state[0]}
            className={className || ''}
            key={label}
            label={label}
            onChange={(e) => state[1](e.target.checked)}
            type="checkbox"
        />
    );
};


// Create a grid of numCols columns. If numCols is not provided either 2 or 3 columns
// will be created based on the number of 'elements' provided.
// Bootstrap Row/Col system margin and padding info: https://getbootstrap.com/docs/5.1/utilities/spacing/
export function gridify(elements: ReactElement[], numCols?: number, colStyle?: CSSProperties): ReactElement {
    if (elements.length == 0) return <></>;
    numCols ||= elements.length > 10 ? 3 : 2;
    const columns = makeChunks(elements, {numChunks: numCols});

    return (
        <Row>
            {columns.map((columnItems, i) => (
                <Col className="px-1" key={i} style={colStyle || {}}>
                    {columnItems}
                </Col>
            ))}
        </Row>
    );
};
