/*
 * Handles the incoming call that is part of OAuth 2.0 authorization code flow.
 */
import React, { useEffect } from 'react';

import { createRestAPIClient } from "masto"
import { FEDIALGO } from 'fedialgo';
import { useSearchParams } from 'react-router-dom';

import { config } from "../config";
import { getLogger } from '../helpers/log_helpers';
import { useAppStorage } from '../hooks/useLocalStorage';
import { useAuthContext } from '../hooks/useAuth';
import { useError } from '../components/helpers/ErrorHandler';
import { User } from '../types';

const logger = getLogger("CallbackPage");
// const GRANT_TYPE = "password";  // TODO: this is not used anywhere/doesn't workon universeodon.com
// const GRANT_TYPE = "authorization_code";
// const GRANT_TYPE = "client_credentials";


export default function CallbackPage() {
    const { logAndSetFormattedError } = useError();
    const [searchParams] = useSearchParams();
    logger.trace(`searchParams:`, searchParams);

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
    const [app] = useAppStorage({ keyName: "app", defaultValue: null })
    const { setLoggedInUser, user } = useAuthContext();
    const paramsCode = searchParams.get('code');

    useEffect(() => {
        if (paramsCode !== null && !user) {
            oAuthUserAndRegisterApp(paramsCode);
        }
    }, [paramsCode]);

    // Get an OAuth token for our app using the code we received from the server
    const oAuthUserAndRegisterApp = async (code: string) => {
        const body = new FormData();

        const handleAuthError = (msg: string, note: string, errorObj: Error) => {
            logAndSetFormattedError({
                args: { app, code, searchParams, user },
                errorObj,
                msg,
                note,
            })
        }

        body.append('grant_type', 'authorization_code');
        body.append('client_id', app.clientId)
        body.append('client_secret', app.clientSecret)
        body.append('redirect_uri', app.redirectUri)
        body.append('code', code);
        body.append('scope', config.app.createAppParams.scopes);

        // TODO: access_token is retrieved manually via fetch() instead of using the masto.js library
        const oauthTokenURI = `${app.website}/oauth/token`;
        logger.trace(`oAuth() oauthTokenURI: "${oauthTokenURI}"\napp:`, app, `\nuser:`, user, `\ncode: "${code}`);
        const oAuthResult = await fetch(oauthTokenURI, {method: 'POST', body});
        const json = await oAuthResult.json()
        const accessToken = json["access_token"];
        const api = createRestAPIClient({accessToken: accessToken, url: app.website});

        // Authenticate the user
        api.v1.accounts.verifyCredentials()
            .then((verifiedUser) => {
                logger.trace(`oAuth() api.v1.accounts.verifyCredentials() succeeded:`, verifiedUser);

                const userData: User = {
                    access_token: accessToken,
                    id: verifiedUser.id,
                    profilePicture: verifiedUser.avatar,
                    server: app.website,
                    username: verifiedUser.username,
                };

                setLoggedInUser(userData).then(() => logger.log(`Logged in '${userData.username}'! User object:`, userData));
            }).catch((errorObj) => {
                handleAuthError(
                    `Failed to login to Mastodon server!`,
                    `api.v1.accounts.verifyCredentials() failed. Try logging out and in again?`,
                    errorObj,
                )
            });

        // Verify or register the app
        api.v1.apps.verifyCredentials()
            .then((verifyResponse) => {
                logger.trace(`oAuth() api.v1.apps.verifyCredentials() succeeded:`, verifyResponse);
            }).catch((errorObj) => {
                handleAuthError(
                    `${FEDIALGO} failed to register itself with the server!`,
                    `oAuth() api.v1.apps.verifyCredentials() failed. Try logging out and in again?`,
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
