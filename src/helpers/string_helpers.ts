/*
 * String manipulation helpers.
 */
import TheAlgorithm from "fedialgo";

export const DEMO_APP = "DEMO APP";
export const LOADING_ERROR_MSG = `Currently loading, please wait a moment and try again.`;

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


// Remove http:// or https:// from the server URL, Remove everything after slash
export function sanitizeServerUrl(server: string): string {
    server = server.replace(/^https?:\/\//, '').split('/')[0];
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


const ordinalSuffix = (n: number): string => {
    if (n > 3 && n < 21) return "th";

    switch (n % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
};
