import React, { CSSProperties } from 'react';
import Button from 'react-bootstrap/esm/Button';
import Form from 'react-bootstrap/esm/Form';

import { createRestAPIClient } from 'masto';
import { FEDIALGO } from "fedialgo";
import { stringifyQuery } from 'ufo';
import { usePersistentState } from "react-persistent-state";

import { App } from '../types';
import { AppStorage, useLocalStorage } from "../hooks/useLocalStorage";
import { getLogger } from '../helpers/log_helpers';
import { config } from '../config';
import { sanitizeServerUrl } from '../helpers/string_helpers';
import { useError } from '../components/helpers/ErrorHandler';
import { error } from 'console';

// Mastodon OAuth scopes required for this app to work. Details: https://docs.joinmastodon.org/api/oauth-scopes/
const OAUTH_SCOPES = [
    "read",
    "write:bookmarks",
    "write:favourites",
    "write:follows",
    "write:media",
    "write:mutes",
    "write:statuses",  // Required for retooting and voting in polls
];

export const OAUTH_SCOPE_STR = OAUTH_SCOPES.join(" ");
const DEFAULT_MASTODON_SERVER = "universeodon.com";
const APP_NAME = `${FEDIALGO}Demo`;  // Name of the app that will be created in the user's Mastodon account
const logger = getLogger("LoginPage");


export default function LoginPage() {
    const { logAndSetFormattedError } = useError();

    // TODO: why is this not using useAppStorage?
    const [_app, setApp] = useLocalStorage({keyName: "app", defaultValue: {}} as AppStorage);
    const [server, setServer] = usePersistentState<string>(DEFAULT_MASTODON_SERVER, {storageKey: "server"});

    const handleError = (errorObj: Error, msg?: string, note?: string, ...args: any[]) => {
        logAndSetFormattedError({
            args: (args || []).concat([{ server, _app }]),
            errorObj,
            msg: msg || "Error occurred while trying to login",
            note,
        });
    }

    const oAuthLogin = async (): Promise<void> => {
        let sanitizedServer = server;

        try {
            sanitizedServer = sanitizeServerUrl(server);
        } catch (err) {
            handleError(err);
            return;
        }

        // OAuth won't allow HashRouter's "#" chars in redirectUris
        const redirectUri = `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, '');
        logger.log(`window.location.pathname: ${window.location.pathname}, redirectUri: ${redirectUri}`); // TODO: remove this log line
        const api = createRestAPIClient({url: sanitizedServer});
        let registeredApp;  // TODO: using 'App' type causes a type error

        if (_app?.clientId) {
            logger.trace(`Found existing app creds to use for '${sanitizedServer}':`, _app);
            registeredApp = _app;
        } else {
            logger.trace(`No existing app found, creating a new app for '${sanitizedServer}':`, _app);

            try {
                // Note that the redirectUris, once specified, cannot be changed without clearing cache and registering a new app.
                registeredApp = await api.v1.apps.create({
                    clientName: APP_NAME,
                    redirectUris: redirectUri,
                    scopes: OAUTH_SCOPE_STR,
                    website: sanitizedServer,
                });
            } catch (error) {
                const msg = `${FEDIALGO} failed to register itself as an app on your Mastodon server!`;
                handleError(error, msg, "Check your server URL and try again.", { api, redirectUri, sanitizedServer });
                return;
            }

            logger.trace("Created app with api.v1.apps.create(), response var 'registeredApp':", registeredApp);
        }

        const query = stringifyQuery({
            client_id: registeredApp.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: OAUTH_SCOPE_STR,
        });

        setApp({...registeredApp, redirectUri });
        const newUrl = `${sanitizedServer}/oauth/authorize?${query}`;
        logger.trace(`redirecting to "${newUrl}"...`);
        window.location.href = newUrl;
    };

    return (
        <div className='vh-100' style={loginContainer}>
            <img src={config.app.showcaseImageUrl} alt="FediAlgo Showcase" style={previewImage} />

            <div>
                <p style={{ lineHeight: 1.3, marginBottom: "10px", marginTop: "13px", textAlign: "center" }}>
                    Fedi-Feed features a customizable algorithm for sorting your feed.<br />
                    You can choose which factors influence the sorting of your timeline.<br />

                    <span style={privacyText}>
                        All calculations are done in your browser. None of your data leaves your machine.
                    </span>
                    <br /><br />

                    To get started enter your Mastodon server in the form: <code>{DEFAULT_MASTODON_SERVER}</code>
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '5px', marginTop: '5px' }}>
                <Form.Group className="mb-0">
                    <Form.Control
                        id="mastodon_server"
                        onChange={(e) => setServer(e.target.value)}
                        placeholder={DEFAULT_MASTODON_SERVER}
                        type="url"
                        value={server}
                    />
                </Form.Group>

                <div style={{ display: 'flex', justifyContent: 'center', marginLeft: '10px' }}>
                    <Button onClick={oAuthLogin}>Login</Button>
                </div>
            </div>
        </div>
    );
};


const loginContainer: CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: "center",
};

const previewImage: CSSProperties = {
    border: "5px solid #DDD",
    borderRadius: "12px",
    boxShadow: "3px 3px 5px black",
    maxHeight: "550px",
};

const privacyText: CSSProperties = {
    color: "magenta",
    fontSize: 17,
    marginTop: "3px",
    marginBottom: "20px",
};
