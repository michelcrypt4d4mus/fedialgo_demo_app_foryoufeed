/*
 * String manipulation helpers.
 */
import { isEmpty, isNil } from "lodash";

import { appLogger } from "./log_helpers";
import { config } from "../config";

// Window events: https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event
export enum Events {
    FOCUS = "focus",
};

export const NETWORK_ERROR = "NetworkError when attempting to fetch resource";


// Locale
export const browserLocale = () => navigator?.language || config.locale.defaultLocale;
export const browserLanguage = () => browserLocale().split('-')[0];
export const browserCountry = () => browserLocale().split('-')[1];

const DATE_FORMAT = Intl.DateTimeFormat(
    browserLocale(),
    {year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric"}
);


// Helpers
export const alphabetize = (arr: string[]) => arr.sort(compareStr);
export const compareStr = (a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase());
export const fileInfo = (file: File) => `file: "${file.name}", size: ${file.size}, type: ${file.type}`;
export const nTimes = (n: number) => `${n} time${n === 1 ? '' : 's'}`;
// Boolean helpers
export const hasAnyCapitalLetters = (str: string) => /[A-Z]/.test(str);
export const isEmptyStr = (s: string | null | undefined) => isNil(s) || isEmpty(s!.trim());


// "image/png" => ".png"
export function mimeTypeExtension(mimeType: string): string {
    const parts = mimeType.split('/');
    return parts.length > 1 ? `.${parts[1]}` : '';
};


// 1st, 2nd 3rd, 4th, etc.
function ordinalSuffix(n: number): string {
    if (n > 3 && n < 21) return "th";

    switch (n % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
};


// Remove http:// or https:// from the server URL, Remove everything after slash
export function sanitizeServerUrl(server: string): string {
    server = server.replace(/^https?:\/\//, '').split('/')[0];

    if (!/^[a-zA-Z0-9.-]+$/.test(server)) {
        throw new Error(`"${server}" does not appear to be a valid server URL.`);
    }

    return `https://${server}`;
};


// Converts a number to a string with the number of decimal places dependent on the value.
export const scoreString = (score: number | null): string => {
    if (!score && score != 0) return "?";
    let decimalPlaces = 1;

    // find the number of decimal places before a non-zero digit
    if (score < 0.0000001) {
        decimalPlaces = 10;
    } else if (score < 0.0001) {
        decimalPlaces = 7;
    } else if (score < 0.001) {
        decimalPlaces = 6;
    } else if (score < 0.01) {
        decimalPlaces = 5;
    } else if (score < 0.1) {
        decimalPlaces = 4;
    } else if (score < 1) {
        decimalPlaces = 3;
    } else if (score < 10) {
        decimalPlaces = 2;
    }

    return `${score.toFixed(decimalPlaces)}`;
};


// Format a timestamp.
export const timestampString = (_timestamp: string): string => {
    const timestamp = new Date(_timestamp);
    const ageInSeconds = (Date.now() - timestamp.getTime()) / 1000;
    const isToday = timestamp.getDate() == new Date().getDate();
    let str: string;

    if (isToday && ageInSeconds < (3600 * 48)) {
        str = `Today ${timestamp.toLocaleTimeString(browserLocale())}`;
    } else if (ageInSeconds < (3600 * 6 * 24)) {
        str = timestamp.toLocaleTimeString(browserLocale(), {weekday: "short"});
    } else if (ageInSeconds < (3600 * 30 * 24)) {
        str = timestamp.toLocaleDateString(browserLocale(), {month: "short", day: "numeric"});
        str += ordinalSuffix(timestamp.getDate());
        str += ` ${timestamp.toLocaleTimeString(browserLocale())}`;
    } else {
        str = DATE_FORMAT.format(timestamp);
    }

    return str;
};


// Get the Fedialgo version from the environment variable
export const versionString = () => {
    try {
        return process.env.FEDIALGO_VERSION;
    } catch (e) {
        appLogger.error(`Error getting version string: ${e}`);
        return `?.?.?`;
    }
};
