/*
 * Read & write to the browser's localStorage to preserve app state between page reloads
 */
import { useState } from "react";

import { App, User } from "../types";
import { ComponentLogger } from "../helpers/log_helpers";

type StorageKey = {
    keyName: string;
    defaultValue: Record<string, unknown> | null;
};

export interface AppStorage extends StorageKey {
    keyName: "app";
    defaultValue: App | null;
};

export interface UserStorage extends StorageKey {
    keyName: "user";
    defaultValue: User | null;
};

export const useAppStorage = (key: AppStorage) => useLocalStorage<AppStorage>(key);
export const useUserStorage = (key: UserStorage) => useLocalStorage<UserStorage>(key);
const logger = new ComponentLogger("useLocalStorage");


export const useLocalStorage = <T extends StorageKey,>(key: T): [T["defaultValue"], (value: T["defaultValue"]) => void] => {
    const { keyName, defaultValue } = key;

    const [storedValue, setStoredValue] = useState<T["defaultValue"]>(() => {
        try {
            const value = window.localStorage.getItem(keyName);

            if (value) {
                // logger.log(`useLocalStorage.getValue(keyname: "${keyName}") got value:`, value);
                // logger.log(`useLocalStorage.getValue(keyname: "${keyName}") parsed value:`, JSON.parse(value));
                return JSON.parse(value);
            } else {
                // logger.log(`useLocalStorage.getValue(keyname: "${keyName}") found nothing, setting to default:`, defaultValue);
                window.localStorage.setItem(keyName, JSON.stringify(defaultValue));
                return defaultValue;
            }
        } catch (err) {
            logger.error(`useLocalStorage.getValue(keyname: "${keyName}") error:`, err);
            return defaultValue;
        }
    });

    const setValue = (newValue: T["defaultValue"]) => {
        try {
            // logger.log(`useLocalStorage.setValue("${keyName}") called with newValue:`, newValue);
            window.localStorage.setItem(keyName, JSON.stringify(newValue));
        } catch (err) {
            logger.error(`setValue() failed!`, err);
        }

        setStoredValue(newValue);
    };

    return [storedValue, setValue];
};
