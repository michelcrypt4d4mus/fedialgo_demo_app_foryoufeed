/**
 * @fileoverview Handles the incoming call that is part of OAuth 2.0 authorization code flow.
 */
import React, { useEffect } from "react";

import { createRestAPIClient } from "masto";
import { FEDIALGO } from "fedialgo";
import { useSearchParams } from "react-router-dom";

import { config } from "../config";
import { getApp, useServerStorage } from "../hooks/useLocalStorage";
import { getLogger } from "../helpers/log_helpers";
import { sanitizeServerUrl } from "../helpers/string_helpers";
import { useAuthContext } from "../hooks/useAuth";
import { useError } from "../components/helpers/ErrorHandler";
import { User } from "../types";

const VERIFY_CREDENTIALS = 'api.v1.accounts.verifyCredentials()';

const logger = getLogger("CallbackPage");


export default function CallbackPage() {
    const { logAndSetFormattedError } = useError();
    const { setLoggedInUser, user } = useAuthContext();
    const [searchParams] = useSearchParams();
    logger.trace(`searchParams:`, searchParams);
    const paramsCode = searchParams.get("code");

    // Example of 'app' object
    // {
    //     clientId: "blahblah",
    //     clientSecret: "blahblahblahblahblahblahblahblah",
    //     id: "519245",
    //     name: "ForYouFeed",
    //     redirectUri: "http://localhost:3000/callback",
    //     vapidKey: "blahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblahblah",
    //     website: "https://mastodon.social",
    // }
    const [serverDomain] = useServerStorage();
    const server = sanitizeServerUrl(serverDomain, true);
    const app = getApp();

    useEffect(() => {
        if (paramsCode !== null && !user) {
            oAuthUserAndRegisterApp(paramsCode);
        }
    }, [paramsCode]);

    // Get an OAuth token for our app using the code we received from the server
    const oAuthUserAndRegisterApp = async (code: string) => {
        const handleAuthError = (msg: string, note: string, errorObj: Error) => {
            logAndSetFormattedError({
                args: { app, code, searchParams, user },
                errorObj,
                msg,
                note,
            })
        }

        const body = new FormData();
        body.append('grant_type', 'authorization_code');
        body.append('client_id', app.clientId)
        body.append('client_secret', app.clientSecret)
        body.append('redirect_uri', app.redirectUri)
        body.append('code', code);
        body.append('scope', config.app.createAppParams.scopes);

        // TODO: access_token is retrieved manually via fetch() instead of using the masto.js library
        const oauthTokenURI = `${server}/oauth/token`;
        logger.trace(`oauthTokenURI: "${oauthTokenURI}"\napp:`, app, `\nuser:`, user, `\ncode: "${code}`);
        const oAuthResult = await fetch(oauthTokenURI, {method: 'POST', body});
        const json = await oAuthResult.json()
        const accessToken = json["access_token"];
        const api = createRestAPIClient({accessToken: accessToken, url: server});

        // Authenticate the user
        api.v1.accounts.verifyCredentials()
            .then((verifiedUser) => {
                logger.trace(`${VERIFY_CREDENTIALS} succeeded:`, verifiedUser);

                const userData: User = {
                    access_token: accessToken,
                    id: verifiedUser.id,
                    profilePicture: verifiedUser.avatar,
                    server: server,
                    username: verifiedUser.username,
                };

                setLoggedInUser(userData);  // TODO: the redirect should be here and not in setLoggedInUser()
            }).catch((errorObj) => {
                handleAuthError(
                    `${FEDIALGO} failed to login to Mastodon server!`,
                    `${VERIFY_CREDENTIALS} failed. Try logging out and in again?`,
                    errorObj,
                )
            });
    };

    return (
        <div>
            <h1>Validating ....</h1>
        </div>
    );
};
