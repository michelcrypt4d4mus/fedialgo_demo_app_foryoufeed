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


// Log lines with "[DEMO APP] <ComponentName>" prefixed
export class ComponentLogger {
    componentName: string;
    logPrefix: string;

    constructor(componentName: string) {
        this.componentName = componentName;
        this.logPrefix = `[${DEMO_APP}] <${componentName}>`;
    }

    error(msg: string, ...args: any[]) {
        console.error(this.makeMsg(msg), ...args);
    }

    warn(msg: string, ...args: any[]) {
        console.warn(this.makeMsg(msg), ...args);
    }

    log(msg: string, ...args: any[]) {
        console.log(this.makeMsg(msg), ...args);
    }

    info(msg: string, ...args: any[]) {
        console.info(this.makeMsg(msg), ...args);
    }

    debug(msg: string, ...args: any[]) {
        console.debug(this.makeMsg(msg), ...args);
    }

    // Only writes logs in debug mode
    trace(msg: string, ...args: any[]) {
        if (!TheAlgorithm.isDebugMode) return;
        this.debug(msg, ...args);
    }

    private makeMsg(msg: string): string {
        return `${this.logPrefix} ${msg}`;
    }
};
