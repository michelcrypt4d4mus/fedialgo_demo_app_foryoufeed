/*
 * Read & write to the browser's localStorage to preserve app state between page reloads
 */
import { useState } from "react";

import { config } from "../config";
import { getLogger } from "../helpers/log_helpers";
import { sanitizeServerUrl } from "../helpers/string_helpers";
import { type App, type ServerUser, type User } from "../types";

const SERVER = "server";
const SERVER_USERS = "serverUsers";

type ServerUserState = [Record<string, ServerUser>, (value: Record<string, ServerUser>) => void];

const logger = getLogger("useLocalStorage");


// Revamp of pkreissel's original implementation
export function useLocalStorage<T>(storageKey: string, defaultValue?: T): [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const value = window.localStorage.getItem(storageKey);

            if (value) {
                return JSON.parse(value);
            } else {
                window.localStorage.setItem(storageKey, JSON.stringify(defaultValue));
                return defaultValue;
            }
        } catch (err) {
            logger.error(`useLocalStorage.getValue(keyname: "${storageKey}") error:`, err);
            return defaultValue;
        }
    });

    const setValue = (newValue: T) => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(newValue));
        } catch (err) {
            logger.error(`setValue() failed!`, err);
        }

        setStoredValue(newValue);
    };

    return [storedValue, setValue];
};


/** Get the registered app properties for 'server' from local storage (if they exist). */
export function getApp(server?: string): App | null {
    const serverUsers = getValue<ServerUser>(SERVER_USERS) || {};
    return serverUsers[server || getServer()]?.app || null;
};


/**
 * Wrap useLocalStorage to store the server URL in sanitized form.
 * @returns
 */
export function useServerStorage(): [string, (value: string) => string] {
    const [server, setRawServer] = useLocalStorage<string>(SERVER, config.app.defaultServer);

    const setServer = (server: string): string => {
        const sanitizedServer = sanitizeServerUrl(server);
        logger.trace(`useServerStorage() setting server to sanitized "${sanitizedServer}"`);
        setRawServer(sanitizedServer);
        return sanitizedServer;
    };

    return [server, setServer];
};


/**
 * Manage a dict keyed by sanitized server URLs, where each value is a ServerUser object.
 * @returns {ServerUserState}
 */
export const useServerUserStorage = (): ServerUserState => useLocalStorage<Record<string, ServerUser>>(SERVER_USERS, {});


/**
 * Helper method for getting and setting the user in localStorage.
 * @returns {[App | null, (app: App) => void]}
 */
export function useAppStorage(serverUserState: ServerUserState): [App | null, (app: App) => void] {
    const setApp = (app: App) => setServerProperties(serverUserState, app, undefined);
    return [serverUserState[0][getServer()]?.app || null, setApp];
};


/**
 * Helper method for getting and setting the user in localStorage.
 * @returns {[User | null, (user: User) => void]}
 */
export function useUserStorage(serverUserState: ServerUserState): [User | null, (user: User) => void] {
    const setUser = (user: User) => setServerProperties(serverUserState, undefined, user);
    return [serverUserState[0][getServer()]?.user || null, setUser];
};


/**
 * If either param is undefined don't overwrite existing values but if either are null then do overwrite.
 * @param {App | null | undefined} app
 * @param {User | null | undefined} user
 */
function setServerProperties(
    serverUserState: ServerUserState,
    app: App | null | undefined,
    user: User | null | undefined
): void {
    const server = getServer();
    const [serverUsers, setServerUsers] = serverUserState;
    serverUsers[server] ??= { app: app || null, user: user || null };

    if (user !== undefined) {
        serverUsers[server].user = user;
    }

    if (app !== undefined) {
        serverUsers[server].app = app;
    }

    logger.trace(`setServerProperties() for "${server}", app:`, app, `\nuser:`, user, `\nserverUsers:`, serverUsers);
    setServerUsers(serverUsers);
};


function getValue<T>(storageKey: string): T {
    const value = window.localStorage.getItem(storageKey);

    if (value) {
        return JSON.parse(value) as T;
    } else {
        throw new Error(`No value found for key "${storageKey}" in localStorage.`);
    }
};


function getServer(): string {
    const server = window.localStorage.getItem(SERVER);

    if (!server) {
        logger.trace(`No server found in localStorage, using default: "${config.app.defaultServer}"`);
        window.localStorage.setItem(SERVER, JSON.stringify(config.app.defaultServer));
        return config.app.defaultServer;
    }

    return server;
}
