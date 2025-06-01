/*
 * Logging helpers.
 */
import TheAlgorithm, { Logger } from "fedialgo";

import { browserCountry, browserLanguage, browserLocale } from "./string_helpers";

export const LOG_PREFIX = ("[DEMO APP]");


// Log stuff with a prefix to distinguish it from other logs
export const errorMsg = (msg: string, ...args: any[]) => console.error(`${LOG_PREFIX} ${msg}`, ...args);
export const warnMsg = (msg: string, ...args: any[]) => console.warn(`${LOG_PREFIX} ${msg}`, ...args);
export const logMsg = (msg: string, ...args: any[]) => console.log(`${LOG_PREFIX} ${msg}`, ...args);
export const infoMsg = (msg: string, ...args: any[]) => console.info(`${LOG_PREFIX} ${msg}`, ...args);
export const debugMsg = (msg: string, ...args: any[]) => console.debug(`${LOG_PREFIX} ${msg}`, ...args);


// Make a Logger instance with a LOG_PREFIX
export const getLogger = (componentName: string, subtitle?: string): Logger => {
    return new Logger(LOG_PREFIX, componentName, subtitle);
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
