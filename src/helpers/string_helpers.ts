/*
 * String manipulation helpers.
 */
import TheAlgorithm from "fedialgo";
import { MimeExtensions } from "../types";

export const DEMO_APP = "DEMO APP";
export const HOMEPAGE = process.env.FEDIALGO_HOMEPAGE;
export const LOADING_ERROR_MSG = `Currently loading, please wait a moment and try again.`;
export const REPO_NAME = HOMEPAGE ? HOMEPAGE.split('/').pop() : null;
export const REPO_URL = HOMEPAGE ? HOMEPAGE.replace(/(\w+)\.github\.io/, `github.com/$1`) : HOMEPAGE;
export const CHANGELOG_URL = `https://github.com/michelcrypt4d4mus/fedialgo/blob/master/CHANGELOG.md`;
export const CRYPTADAMUS_MASTODON_URL = "https://universeodon.com/@cryptadamist";

// Locale
const DEFAULT_LOCALE = "en-US";
export const browserLocale = () => navigator?.language || DEFAULT_LOCALE;
export const browserLanguage = () => browserLocale().split('-')[0];
export const browserCountry = () => browserLocale().split('-')[1];

// Log helpers
export const errorMsg = (msg: string, ...args: any[]) => console.error(`[${DEMO_APP}] ${msg}`, ...args);
export const warnMsg = (msg: string, ...args: any[]) => console.warn(`[${DEMO_APP}] ${msg}`, ...args);
export const logMsg = (msg: string, ...args: any[]) => console.log(`[${DEMO_APP}] ${msg}`, ...args);
export const infoMsg = (msg: string, ...args: any[]) => console.info(`[${DEMO_APP}] ${msg}`, ...args);
export const debugMsg = (msg: string, ...args: any[]) => console.debug(`[${DEMO_APP}] ${msg}`, ...args);
export const logSafe = (msg: string, ...args: any[]) => TheAlgorithm.isDebugMode && logMsg(msg, ...args);

// for use with sort()
export const compareStr = (a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase());

const DATE_FORMAT = Intl.DateTimeFormat(
    browserLocale(),
    {year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric"}
);


export function fileInfo(file: File): string {
    return `file: "${file.name}", size: ${file.size}, type: ${file.type}`;
};


// Log the browser's locale information to the console
export const logLocaleInfo = (): void => {
    const msg = [
        `navigator.locale="${browserLocale()}"`,
        `language="${browserLanguage()}"`,
        `country="${browserCountry()}"`,
        `process.env.NODE_ENV="${process.env.NODE_ENV}"`,
        `process.env.FEDIALGO_DEBUG="${process.env.FEDIALGO_DEBUG}"`,
        `TheAlgorithm.isDebugMode="${TheAlgorithm.isDebugMode}"`,
        `process.env.FEDIALGO_VERSION="${process.env.FEDIALGO_VERSION}"`,
    ];

    logMsg(`${msg.join(", ")}`);
};


// Build a map of MIME types to file extensions used by DropZone for image attachments etc.
export const buildMimeExtensions = (mimeTypes: string[]): MimeExtensions => {
    const mimeExtensions = mimeTypes.reduce((acc, mimeType) => {
        if (mimeType.startsWith('audio/')) {
            acc['audio/*'] ||= [];
            acc['audio/*'].push(mimeTypeExtension(mimeType));
        } else if (mimeType.startsWith('image/')) {
            acc['image/*'] ||= [];
            acc['image/*'].push(mimeTypeExtension(mimeType));
            if (mimeType === 'image/jpg') acc['image/*'].push('.jpeg'); // Add .jpeg extension support
        } else if (mimeType.startsWith('video/')) {
            acc['video/*'] ||= [];

            if (mimeType === 'video/quicktime') {
                acc['video/*'].push('.mov'); // Add .mov extension support
            } else {
                acc['video/*'].push(mimeTypeExtension(mimeType));
            }
        } else {
            warnMsg(`Unknown MIME type in home server's attachmentsConfig: ${mimeType}`);
        }

        return acc;
    }, {} as MimeExtensions);

    console.debug(`Server accepted MIME types:`, mimeExtensions);
    return mimeExtensions;
}


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


export const timestampString = (_timestamp: string): string => {
    const timestamp = new Date(_timestamp);
    const ageInSeconds = (Date.now() - timestamp.getTime()) / 1000;
    const isToday = timestamp.getDate() == new Date().getDate();
    let str: string;

    if (isToday && ageInSeconds < (3600 * 48)) {
        str = `Today ${timestamp.toLocaleTimeString(browserLocale())}`;
    } else if (ageInSeconds < (3600 * 6 * 24)) {
        str = timestamp.toLocaleTimeString(browserLocale(), { weekday: "short" });
    } else if (ageInSeconds < (3600 * 30 * 24)) {
        str = timestamp.toLocaleDateString(browserLocale(), { month: "short", day: "numeric" });
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
        console.error(`Error getting version string: ${e}`);
        return `?.?.?`;
    }
};


// "image/png" => ".png"
function mimeTypeExtension(mimeType: string): string {
    const parts = mimeType.split('/');
    return parts.length > 1 ? `.${parts[1]}` : '';
};


function ordinalSuffix(n: number): string {
    if (n > 3 && n < 21) return "th";

    switch (n % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
};
