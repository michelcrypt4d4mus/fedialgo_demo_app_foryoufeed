/**
 * @fileoverview Read & write to browser's localStorage to preserve app state between page reloads.
 */
import { useState } from "react";

import { config } from "../config";
import { getLogger } from "../helpers/log_helpers";
import { sanitizeServerUrl } from "../helpers/string_helpers";
import { type App, type ServerUser, type User } from "../types";

type UseStorageTuple<T> = [T, ((value: T) => void) | ((value: T) => T)];
type UseNullableStorage<T> = [T | null, (value: T) => void];

type ServerUserState = [
    Record<string, ServerUser>,
    (value: Record<string, ServerUser>) => void
];

const SERVER = "server";
const SERVER_USERS = "serverUsers";

const logger = getLogger("useLocalStorage");


/**
 * Retrieve value at 'storageKey' from browser storage (if one exists) and create a function to
 * update the value at 'storageKey' that can be called when needed.
 * Revamp of pkreissel's original implementation.
 * @template T
 * @param {string} storageKey - Retrieve the data storage at this key. Returned fxn will write data here.
 * @param {T} [defaultValue] - Initial value to write to storage if there's nothing there to retrieve.
 * @returns {UseStorageTuple} 2-tuple with the current storage value and a fxn to store a new value.
 */
export function useLocalStorage<T>(storageKey: string, defaultValue?: T): UseStorageTuple<T> {
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


/**
 * Get the registered Fedialgo app properties for a Mastodon server from local storage (if they exist).
 * @param {string} [server] - Mastodon server to get app properties for (defaults to getServer() value)
 * @returns {App | null}
 */
export function getApp(server?: string): App | null {
    const serverUsers = getValue<ServerUser>(SERVER_USERS) || {};
    return serverUsers[server || getServer()]?.app || null;
};


/**
 * Wrap useLocalStorage() to store the server URL in sanitized form.
 * @returns
 */
export function useServerStorage(): UseStorageTuple<string> {
    const [server, setRawServer] = useLocalStorage<string>(SERVER, config.app.defaultServer);

    const setServer = (server: string): string => {
        const sanitizedServer = sanitizeServerUrl(server);
        logger.trace(`useServerStorage() setting server to sanitized "${sanitizedServer}"`);
        setRawServer(sanitizedServer);
        return sanitizedServer;
    };

    return [server, setServer];
}


/**
 * Manage a dict keyed by sanitized server URLs, where each value is a ServerUser object.
 * @returns {ServerUserState}
 */
export function useServerUserStorage(): ServerUserState {
    return useLocalStorage<Record<string, ServerUser>>(SERVER_USERS, {});
}


/**
 * Helper method for getting and setting the App in localStorage.
 * @returns {[App | null, (app: App) => void]}
 */
export function useAppStorage(serverUserState: ServerUserState): UseNullableStorage<App> {
    const setApp = (app: App) => setServerProperties(serverUserState, app, undefined);
    return [serverUserState[0][getServer()]?.app || null, setApp];
}


/**
 * Helper method for getting and setting the User in localStorage.
 * @returns {[User | null, (user: User) => void]}
 */
export function useUserStorage(serverUserState: ServerUserState): UseNullableStorage<User> {
    const setUser = (user: User) => setServerProperties(serverUserState, undefined, user);
    return [serverUserState[0][getServer()]?.user || null, setUser];
}


/**
 * If either 'app' or 'user' arg is undefined don't overwrite existing values in localStorage
 * but if either is 'null' then *DO* overwrite them.
 * @param {ServerUserState} serverUserState
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
}


/**
 * Read and deserialize JSON data from browser storage.
 * @private
 * @param {string} storageKey - Key to read data from.
 * @returns {T} - Deserialized data.
 * @throws {Error} If no data exists in browser storage at 'storageKey'.
 */
function getValue<T>(storageKey: string): T {
    const value = window.localStorage.getItem(storageKey);

    if (value) {
        return JSON.parse(value) as T;
    } else {
        throw new Error(`No value found for key "${storageKey}" in localStorage.`);
    }
}


/**
 * Retrieve the Mastodon server URL from browser storage if it exists, otherwise
 * defaults to returning configured value at 'config.app.defaultServer'.
 * @private
 * @returns {string} Mastodon server URL.
 */
function getServer(): string {
    const server = window.localStorage.getItem(SERVER);

    if (!server) {
        logger.trace(`No server found in localStorage, using default: "${config.app.defaultServer}"`);
        window.localStorage.setItem(SERVER, JSON.stringify(config.app.defaultServer));
        return config.app.defaultServer;
    }

    return server;
}
