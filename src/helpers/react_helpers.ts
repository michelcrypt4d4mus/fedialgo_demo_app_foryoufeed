/*
 * Navigation helpers for React components.
 */
import { MouseEvent } from "react";

import { logMsg } from "./string_helpers";
import { Toot, type TrendingWithHistory } from "fedialgo";

export const isProduction = process.env.NODE_ENV === 'production';

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
