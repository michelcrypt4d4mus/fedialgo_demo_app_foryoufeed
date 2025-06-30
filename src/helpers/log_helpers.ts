/*
 * Logging helpers.
 */
import TheAlgorithm, { Logger } from "fedialgo";

import { browserCountry, browserLanguage, browserLocale } from "./string_helpers";

export const LOG_PREFIX = ("DEMO APP");

// Make a Logger instance with a LOG_PREFIX
export const getLogger = (...args: string[]) => new Logger(LOG_PREFIX, ...args);
export const appLogger = getLogger();


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

    appLogger.log(`${msg.join(", ")}`);
};
