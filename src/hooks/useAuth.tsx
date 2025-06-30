/*
 * Authorization context for the app.
 */
import React, { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";

import { getLogger } from "../helpers/log_helpers";
import { sanitizeServerUrl } from "../helpers/string_helpers";
import { useError } from "../components/helpers/ErrorHandler";
import { useServerStorage, useServerUserStorage } from "./useLocalStorage";
import { type App, type User } from "../types";

const logger = getLogger("AuthProvider");

const AuthContext = createContext({
    logout: (_preserveAppErrors?: boolean) => {},
    setApp: (_app: object) => undefined,
    setLoggedInUser: (_user: User) => {},
    setUser: (_user: User | null) => undefined,
    user: null,
});


export default function AuthProvider(props: PropsWithChildren) {
    const { resetErrors } = useError();
    const navigate = useNavigate();

    const [server] = useServerStorage();
    const [serverUsers, setServerUsers] = useServerUserStorage();
    const sanitizedServer = sanitizeServerUrl(server);
    const serverConfig = serverUsers[sanitizedServer];
    const app = serverConfig?.app;
    const user = serverConfig?.user;

    // User object looks like this:
    // {
    //     access_token: "xyssdsfdnffdwf"
    //     id: "10936317990452342342"
    //     profilePicture: "https://media.universeodon.com/accounts/avatars/109/363/179/904/598/380/original/dfnwodfnow.jpg"
    //     server: "https://universeodon.com"
    //     username: "cryptadamus"
    // }
    const setLoggedInUser = async (user: User) => {
        logger.trace(`setLoggedInUser() to "${sanitizeServerUrl}", app:`, app, `\nuser:`, user, `\nserverUsers:`, serverUsers);
        serverUsers[sanitizedServer] = { app, user };  // TODO: prolly better to not mutate. should copy to new object
        setServerUsers(serverUsers);
        logger.debug(`Logged in user "${user.username}"`);
        navigate("/");
    };

    const setApp = (app: App) => {
        logger.trace(`setApp() for "${sanitizeServerUrl}", app:`, app, `\nuser:`, user, `\nserverUsers:`, serverUsers);

        if (serverUsers[sanitizedServer]) {
            serverUsers[sanitizedServer].app = app;
        } else {
            serverUsers[sanitizedServer] = { app, user: null };
        }

        setServerUsers(serverUsers);
    }

    const setUser = async (userArg: User | null) => {
        logger.trace(`setUser() for "${sanitizeServerUrl}", app:`, app, `\nuser:`, user, `\nserverUsers:`, serverUsers);

        if (serverUsers[sanitizedServer]) {
            serverUsers[sanitizedServer].user = userArg;
        } else {
            serverUsers[sanitizedServer] = { app, user: userArg };
        }

        setServerUsers(serverUsers);
    }

    // Call this function to sign out logged in user (revoke their OAuth token) and reset the app state.
    // If preserveAppErrors is true, which happens during forced logouts because of API errors,
    // don't reset the app's error state, so that the error modal can be shown after logout.
    const logout = async (preserveAppErrors: boolean = false): Promise<void> => {
        logger.log("logout() called with preserveAppErrors:", preserveAppErrors);
        const body = new FormData();
        body.append("token", user.access_token);
        body.append("client_id", app.clientId)
        body.append("client_secret", app.clientSecret);
        const oauthRevokeURL = user.server + '/oauth/revoke';

        // POST to oauthRevokeURL throws error but log shows "Status code: 200" so I think it works? Hard to
        // get at the actual status code variable (it's only in the low level logs).
        // Error: "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://universeodon.com/oauth/revoke. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing). Status code: 200.""
        try {
            const _logoutResponse = await axios.post(oauthRevokeURL, body);
        } catch (error) {
            logger.warn(`(Probably innocuous) error while trying to logout "${error}":`, error);
        }

        !preserveAppErrors && resetErrors();
        serverUsers[sanitizedServer] = { app, user: null };  // TODO: prolly better to not mutate. should copy to new object
        setServerUsers(serverUsers);
        navigate("/#/login", {replace: true});
    };

    const value = useMemo(
        () => ({ logout, setLoggedInUser, setApp, setUser, user }),
        [app, server, user]
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
