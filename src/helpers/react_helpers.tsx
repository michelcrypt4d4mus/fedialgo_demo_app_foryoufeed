/*
 * Navigation helpers for React components.
 */
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { Children, isValidElement, CSSProperties, MouseEvent, ReactElement, ReactNode, useState } from "react";

import { type TrendingWithHistory, Toot, makeChunks } from 'fedialgo';

import { appLogger } from "./log_helpers";
import { isEmptyStr } from './string_helpers';

// TODO: this shouldn't be here...
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
    appLogger.log("openToot() called with:", toot);
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
    className?: string,
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


// Returns array of strings extracted from component hierarchy
// Inspired by https://github.com/fernandopasik/react-children-utilities/blob/main/src/lib/onlyText.ts
export function extractText(children: ReactNode | ReactNode[]): string[] {
    if (!Array.isArray(children) && !isValidElement(children)) {
        const str = nodeToString(children);
        return isEmptyStr(str) ? [] : [str];
    }

    // TODO: something is really wrong with the type checker here - only with all this forcible casting
    // would it accept that the "elements" accumulator in reduce() is a string array.
    let nodeStrings = Children.toArray(children).reduce(
        (elements, child) => {
            elements = elements as string[];

            if (hasChildren(child)) {
                const extracted = extractText(child.props.children);
                elements = [...elements, ...extracted];
            } else if (isValidElement(child)) {
                // newText = '';
            } else {
                const str = nodeToString(child);

                if (!isEmptyStr(str)) {
                    elements = [...elements, str];
                }
            }

            return (elements as string[]).flat().flat();
        },
        [] as string[]
    ) as string[];

    nodeStrings = nodeStrings.filter((s) => !isEmptyStr(s));
    appLogger.trace("extractText() called with children:", children, "\nresulting in:", nodeStrings);
    return nodeStrings;
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


// create a horizontal spacer of a given width
export function horizontalSpacer(width: number, key?: string): ReactElement {
    // return <span style={{display: "inline-block", width: `${width}px`}} />;
    return <div key={key || ''} style={{width: `${width}px`}} />
};


export function verticalSpacer(height: number, key?: string): ReactElement {
    return <div key={key || ''} style={{height: `${height}px`, width: "100%"}} />
};


function nodeToString(child?: ReactNode): string | null {
    if (typeof child === 'undefined' || child === null || typeof child === 'boolean') {
        return null;
    }

    if (JSON.stringify(child) === '{}') {
        return null;
    }

    return child.toString();
};


// From https://github.com/fernandopasik/react-children-utilities/blob/main/src/lib/hasChildren.ts
const hasChildren = (elem: ReactNode,): elem is ReactElement<{ children: ReactNode | ReactNode[] }> => (
    isValidElement<{ children?: ReactNode[] }>(elem) && Boolean(elem.props.children)
);
