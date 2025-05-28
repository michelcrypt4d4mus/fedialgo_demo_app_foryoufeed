/*
 * Authorization context for the app.
 */
import axios from "axios";
import { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { ComponentLogger } from "../helpers/log_helpers";
import { useAppStorage, useUserStorage } from "./useLocalStorage";
import { useError } from "../components/helpers/ErrorHandler";
import { User } from "../types";

const logger = new ComponentLogger("AuthProvider");

const AuthContext = createContext({
    setLoggedInUser: async (_user: User) => {},
    logout: () => {},
    setApp: (_app: any) => undefined,
    setUser: (_user: User | null) => undefined,
    user: null,
});


export default function AuthProvider(props: PropsWithChildren) {
    const { setError } = useError();
    const navigate = useNavigate();

    const [app, setApp] = useAppStorage({ keyName: "app", defaultValue: null });
    const [user, setUser] = useUserStorage({ keyName: "user", defaultValue: null });

    // User object looks like this:
    // {
    //     access_token: "xyssdsfdnffdwf"
    //     id: "10936317990452342342"
    //     profilePicture: "https://media.universeodon.com/accounts/avatars/109/363/179/904/598/380/original/dfnwodfnow.jpg"
    //     server: "https://universeodon.com"
    //     username: "cryptadamus"
    // }
    const setLoggedInUser = async (user: User) => {
        logger.trace(`setLoggedInUser() called, app:`, app, `\nuser:`, user);
        setUser(user);
        navigate("/");
    };

    // call this function to sign out logged in user
    const logout = async (): Promise<void> => {
        logger.log("logout() called...")
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
            logger.warn(`(Possibly innocuous) error while trying to logout "${error}":`, error);
        }

        setError("");
        setUser(null);
        navigate("/login", {replace: true});
    };

    const value = useMemo(
        () => ({ logout, setLoggedInUser, setApp, setUser, user }),
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
