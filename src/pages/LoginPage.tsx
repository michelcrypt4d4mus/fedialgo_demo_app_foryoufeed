import React, { CSSProperties } from 'react';

import Button from 'react-bootstrap/esm/Button';
import Form from 'react-bootstrap/esm/Form';
import { createRestAPIClient } from 'masto';
import { FEDIALGO, isDebugMode } from "fedialgo";
import { stringifyQuery } from 'ufo';
import { usePersistentState } from "react-persistent-state";

import { App } from '../types';
import { AppStorage, useLocalStorage } from "../hooks/useLocalStorage";
import { logMsg, logSafe, sanitizeServerUrl } from '../helpers/string_helpers';
// const showcase = require("../../public/assets/Showcase.jpg");

// Mastodon OAuth scopes required for this app to work. Details: https://docs.joinmastodon.org/api/oauth-scopes/
const OAUTH_SCOPES = [
    "read",
    "write:bookmarks",
    "write:favourites",
    "write:follows",
    "write:statuses",  // Required for retooting and voting in polls
];

export const OAUTH_SCOPE_STR = OAUTH_SCOPES.join(" ");
const DEFAULT_MASTODON_SERVER = "universeodon.com";
const APP_NAME = `${FEDIALGO}Demo`;  // Name of the app that will be created in the user's Mastodon account
const LOG_PREFIX = `<LoginPage>`;


export default function LoginPage() {
    // TODO: why is this not using useAppStorage?
    const [_app, setApp] = useLocalStorage({keyName: "app", defaultValue: {}} as AppStorage);
    const [server, setServer] = usePersistentState<string>(DEFAULT_MASTODON_SERVER, {storageKey: "server"});
    const logCreds = (msg: string, ...args: any[]) => logSafe(`${LOG_PREFIX} ${msg}`, ...args);

    const loginRedirect = async (): Promise<void> => {
        const sanitizedServer = sanitizeServerUrl(server);
        const api = createRestAPIClient({url: sanitizedServer});
        const redirectUri = window.location.origin + "/callback";
        let appTouse;  // TODO: using 'App' type causes a type error

        if (_app?.clientId) {
            logCreds(`Found existing app creds to use connecting to '${sanitizedServer}':`, _app);
            appTouse = _app;
        } else {
            logCreds(`No existing app found, creating a new app for '${sanitizedServer}':`, _app);

            appTouse = await api.v1.apps.create({
                clientName: APP_NAME,
                redirectUris: redirectUri,
                scopes: OAUTH_SCOPE_STR,
                website: sanitizedServer,
            });

            logCreds("Created app with api.v1.apps.create(), response var 'appTouse':", appTouse);
        }

        const query = stringifyQuery({
            client_id: appTouse.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: OAUTH_SCOPE_STR,
        });

        setApp({...appTouse, redirectUri });
        const newUrl = `${sanitizedServer}/oauth/authorize?${query}`;
        logCreds(`redirecting to "${newUrl}"...`);
        window.location.href = newUrl;
    };

    return (
        <div className='vh-100' style={loginContainer}>
            <img src={"/assets/Showcase.jpg"} style={previewImage}/>

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
                    <Button onClick={loginRedirect}>Login</Button>
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
