/*
 * The footer that appears on the login screen.
 */
import React, { CSSProperties } from "react";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/esm/Navbar";
import Container from "react-bootstrap/Container";

import { config } from "../config";
import { REPO_URL } from "../helpers/string_helpers";


export default function Footer() {
    return (
        <Navbar expand="lg" className="bg-body-tertiary" bg="dark" data-bs-theme="dark" style={{marginTop: '50px'}}>
            <Container>
                <Navbar.Brand style={navLink}>FediAlgo</Navbar.Brand>

                <Nav className="me-auto">
                    {/* <Nav.Link href="/" style={navLink}>Home</Nav.Link> */}
                    <Nav.Link href={REPO_URL} style={navLink}>
                        <img
                            alt="Github Logo"
                            className="d-inline-block align-top"
                            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                            style={elementStyle}
                        />

                        <span className="p-2"> Code on Github</span>
                    </Nav.Link>

                    <Nav.Link href={config.app.developerMastodonUrl} style={navLink}>
                        <img
                            alt="Michel de Cryptadamus Logo"
                            className="d-inline-block align-top"
                            src={config.app.headerIconUrl}
                            style={elementStyle}
                        />

                        <span className="p-2"> Follow me on Mastodon</span>
                    </Nav.Link>

                    <Nav.Link href="https://chaos.social/@pkreissel" style={navLink}>
                        <img
                            alt="Chaos.social Logo"
                            className="d-inline-block align-top"
                            src="https://assets.chaos.social/accounts/avatars/000/242/007/original/97b58ba7002b2c8b.jpg"
                            style={elementStyle}
                        />

                        <span className="p-2"> Follow pkreissel on Mastodon</span>
                    </Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    );
};


const elementStyle: CSSProperties = {
    borderRadius: 5,
    height: 20,
    width: 20,
};

const navLink: CSSProperties = {
    color: "white",
};
