/*
 * Read & write to the browser's localStorage to preserve app state between page reloads
 */
import { useState } from "react";

import { config } from "../config";
import { getLogger } from "../helpers/log_helpers";
import { type App, type User } from "../types";

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


export const useAppStorage = () => useLocalStorage<App | null>("app", null);
export const useServerStorage = () => useLocalStorage<string | null>("server", config.app.defaultServer);
export const useUserStorage = () => useLocalStorage<User | null>("user", null);
