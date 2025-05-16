/*
 * Authorization context for the app.
 */
import axios from "axios";
import React, { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { logMsg, logSafe } from "../helpers/string_helpers";
import { useAppStorage, useUserStorage } from "./useLocalStorage";
import { User } from "../types";

const LOG_PREFIX = `<AuthProvider>`;

const AuthContext = createContext({
    loginUser: async (_user: User) => {},
    logout: () => {},
    user: null,
});


export default function AuthProvider(props: PropsWithChildren) {
    const [app, _setApp] = useAppStorage({ keyName: "app", defaultValue: null });
    const [user, setUser] = useUserStorage({ keyName: "user", defaultValue: null });

    const log = (msg: string, ...args: any[]) => logMsg(`${LOG_PREFIX} ${msg}`, ...args);
    const navigate = useNavigate();
    window.location.hash

    const [searchParams, setSearchParams] = useSearchParams();
    // logMsg(`<AuthProvider> searchParams:`, searchParams);

    // NOTE: this doesn't actually authenticate the user, it just sets the user object in local storage
    // call this function when you want to authenticate the user. User object looks like this:
    // {
    //     access_token: "xyssdsfdnffdwf"
    //     id: "10936317990452342342"
    //     profilePicture: "https://media.universeodon.com/accounts/avatars/109/363/179/904/598/380/original/dfnwodfnow.jpg"
    //     server: "https://universeodon.com"
    //     username: "cryptadamus"
    // }
    const loginUser = async (user: User) => {
        logSafe(`${LOG_PREFIX} loginUser() called, app:`, app, `\nuser:`, user);
        setUser(user);
        navigate("/");
    };

    // call this function to sign out logged in user
    const logout = async (): Promise<void> => {
        log("logout() called...")
        const body = new FormData();
        body.append("token", user.access_token);
        body.append("client_id", app.clientId)
        body.append("client_secret", app.clientSecret);
        const oauthRevokeURL = user.server + '/oauth/revoke';

        try {
            // Throws error but log shows "Status code: 200" so I think it works? Hard to get at the actual
            // status code variable; it's only in the low level logs.
            // Error: "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://universeodon.com/oauth/revoke. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing). Status code: 200.""
            const _logoutResponse = await axios.post(oauthRevokeURL, body);
        } catch (error) {
            console.warn(`Error while trying to logout "${error}":`, error);
        }

        setUser(null);
        navigate("/login", {replace: true});
    };

    const value = useMemo(
        () => ({ user, loginUser, logout }),
        [user]
    );

    return (
        <AuthContext.Provider value={value}>
            {props.children}
        </AuthContext.Provider>
    );
};


export const useAuthContext = () => {
    return useContext(AuthContext);
};
