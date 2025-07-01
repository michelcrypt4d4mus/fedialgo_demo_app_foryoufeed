/*
 * Authorization context for the app.
 */
import React, { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";

import { getLogger } from "../helpers/log_helpers";
import { useError } from "../components/helpers/ErrorHandler";
import { useAppStorage, useServerStorage, useServerUserStorage, useUserStorage } from "./useLocalStorage";
import { type User } from "../types";

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

    const serverUserState = useServerUserStorage();
    const [app, setApp] = useAppStorage(serverUserState);
    const [user, setUser] = useUserStorage(serverUserState);
    const [server] = useServerStorage();

    // User object looks like this:
    // {
    //     access_token: "xyssdsfdnffdwf"
    //     id: "10936317990452342342"
    //     profilePicture: "https://media.universeodon.com/accounts/avatars/109/363/179/904/598/380/original/dfnwodfnow.jpg"
    //     server: "https://universeodon.com"
    //     username: "cryptadamus"
    // }
    const setLoggedInUser = async (user: User) => {
        setUser(user);
        logger.debug(`Logged in user "${user.username}"`);
        navigate("/");
    };

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
        setUser(null);
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
