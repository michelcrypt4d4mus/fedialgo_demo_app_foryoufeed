/*
 * Logging helpers.
 */
import TheAlgorithm from "fedialgo";

import { DEMO_APP, browserCountry, browserLanguage, browserLocale } from "./string_helpers";


export const errorMsg = (msg: string, ...args: any[]) => console.error(`[${DEMO_APP}] ${msg}`, ...args);
export const warnMsg = (msg: string, ...args: any[]) => console.warn(`[${DEMO_APP}] ${msg}`, ...args);
export const logMsg = (msg: string, ...args: any[]) => console.log(`[${DEMO_APP}] ${msg}`, ...args);
export const infoMsg = (msg: string, ...args: any[]) => console.info(`[${DEMO_APP}] ${msg}`, ...args);
export const debugMsg = (msg: string, ...args: any[]) => console.debug(`[${DEMO_APP}] ${msg}`, ...args);
export const logSafe = (msg: string, ...args: any[]) => TheAlgorithm.isDebugMode && logMsg(msg, ...args);


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
