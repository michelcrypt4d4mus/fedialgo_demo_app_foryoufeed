import React, { CSSProperties } from 'react';
import Button from 'react-bootstrap/esm/Button';
import Form from 'react-bootstrap/esm/Form';

import { createRestAPIClient } from 'masto';
import { FEDIALGO } from "fedialgo";
import { stringifyQuery } from 'ufo';

// import { App } from '../types';
import { useServerStorage, useServerUserStorage } from "../hooks/useLocalStorage";
import { config } from '../config';
import { getLogger } from '../helpers/log_helpers';
import { sanitizeServerUrl } from '../helpers/string_helpers';
import { useError } from '../components/helpers/ErrorHandler';

const logger = getLogger("LoginPage");


export default function LoginPage() {
    const { logAndSetFormattedError } = useError();
    const [server, setServer] = useServerStorage();
    const [serverUsers, setServerUsers] = useServerUserStorage();

    const handleError = (errorObj: Error, msg?: string, note?: string, ...args: unknown[]) => {
        logAndSetFormattedError({
            args: (args || []).concat([{ server, serverUsers }]),
            errorObj,
            logger,
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
        const api = createRestAPIClient({url: sanitizedServer});
        const _app = serverUsers[sanitizedServer]?.app;
        let registeredApp;  // TODO: using 'App' type causes a type error

        if (_app?.clientId) {
            logger.trace(`Found existing app creds to use for '${sanitizedServer}':`, _app);
            registeredApp = _app;
        } else {
            logger.log(`No existing app found, registering a new app for '${sanitizedServer}'`);

            try {
                // Note that the redirectUris, once specified, cannot be changed without clearing cache and registering a new app.
                registeredApp = await api.v1.apps.create({...config.app.createAppParams, redirectUris: redirectUri});
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
            scope: config.app.createAppParams.scopes,
        });

        const fedialgoApp = {...registeredApp, redirectUri };

        if (serverUsers[sanitizedServer]) {
            serverUsers[sanitizedServer].app = fedialgoApp;
        } else {
            serverUsers[sanitizedServer] = { app: fedialgoApp, user: null };
        }

        setServerUsers(serverUsers);
        const newUrl = `${sanitizedServer}/oauth/authorize?${query}`;
        logger.trace(`redirecting to "${newUrl}"...`);
        window.location.href = newUrl;
    };

    return (
        <div className='vh-100' style={loginContainer}>
            <img src={config.app.showcaseImageUrl} alt="FediAlgo Showcase" style={previewImage} />

            <div>
                <p style={descriptionText}>
                    Fedi-Feed features a customizable algorithm for sorting your feed.<br />
                    You can choose which factors influence the sorting of your timeline.<br />

                    <span style={privacyText}>
                        All calculations are done in your browser. None of your data leaves your machine.
                    </span>
                    <br /><br />

                    To get started enter your Mastodon server in the form: <code>{config.app.defaultServer}</code>
                </p>
            </div>

            <div style={serverContainer}>
                <Form.Group className="mb-0">
                    <Form.Control
                        id="mastodon_server"
                        onChange={(e) => setServer(e.target.value)}
                        placeholder={config.app.defaultServer}
                        type="url"
                        value={server}
                    />
                </Form.Group>

                <div style={loginButtonStyle}>
                    <Button onClick={oAuthLogin}>Login</Button>
                </div>
            </div>
        </div>
    );
};


const descriptionText: CSSProperties = {
    lineHeight: 1.3,
    marginBottom: "10px",
    marginTop: "13px",
    textAlign: "center"
};

const loginButtonStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    marginLeft: '10px'
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

const serverContainer: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: '5px',
    marginTop: '5px'
};
