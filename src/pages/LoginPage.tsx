import React from 'react';
import { createRestAPIClient } from 'masto';
import { stringifyQuery } from 'ufo'
import Button from 'react-bootstrap/esm/Button';
import Form from 'react-bootstrap/esm/Form';
import { usePersistentState } from "react-persistent-state"
import { useLocalStorage, AppStorage } from "../hooks/useLocalStorage";

export default function LoginPage() {
    const [server, setServer] = usePersistentState<string>("", "server");

    const [_app, setApp] = useLocalStorage({ keyName: "app", defaultValue: {} } as AppStorage)

    const loginRedirect = async (): Promise<void> => {
        const sanitized_server = server.replace("https://", "").replace("http://", "");
        const api = await createRestAPIClient({
            url: `https://${sanitized_server}`,
        });
        const scope = "read write:favourites write:statuses write:follows"
        const redirectUri = window.location.origin + "/callback"
        const app = await api.v1.apps.create({
            clientName: "ForYouFeed",
            redirectUris: redirectUri,
            scopes: scope,
            website: `https://${sanitized_server}`,
        });
        console.log(`app variable:`)
        console.log(app)

        setApp({ ...app, redirectUri })
        const query = stringifyQuery({
            client_id: app.clientId,
            scope: scope,
            response_type: 'code',
            redirect_uri: redirectUri
        })

        window.location.href = `https://${sanitized_server}/oauth/authorize?${query}`
        return
    }
    return (
        <>
            <div className='vh-100' style={{
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: "center",
                display: 'flex',
            }}>
                <img src={"/assets/Showcase.png"} style={{ maxHeight: "40%" }} />
                <div>
                    <p style={{ lineHeight: 2, textAlign: "center" }}>
                        Fedi-Feed features a customizable algorithm for sorting your feed.
                        <br />
                        You can choose which factors influence the sorting of your feed.
                        <br />
                        None of your data is stored on our servers.
                        All calculations are done in your browser.
                        <br />
                        To get started:
                        <br />
                    </p>
                </div>
                <Form.Group className="mb-3 align-middle">
                    <Form.Label className="text-center w-100">Enter Mastodon Server in the form: mastodon.social</Form.Label >
                    <Form.Control type="url" id="mastodon_server" placeholder="mastodon.social" onChange={(e) => {
                        setServer(e.target.value);
                    }} value={server} />
                </Form.Group>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <Button onClick={loginRedirect}>Login</Button>
                </div>
            </div>
        </>
    )
}
