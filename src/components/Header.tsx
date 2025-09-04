/*
 * Header component on the feed page.
 */
import React, { Button, Col, Container, Row } from "react-bootstrap";
import { CSSProperties } from "react";

import { FEDIALGO } from "fedialgo";

import { config } from "../config";
import { TEXT_CENTER, TEXT_CENTER_P2, mildlyRoundedCorners, whiteFont } from "../helpers/style_helpers";
import { useAuthContext } from "../hooks/useAuth";

// React bootstrap classnames etc.
const ALIGN_MIDDLE = "align-middle";
const ALIGN_MIDDLE_D_INLINE = `${ALIGN_MIDDLE} d-inline`;
const ALIGN_MIDDLE_D_INLINE_BLOCK = `${ALIGN_MIDDLE_D_INLINE}-block`;
const TITLE_FONT_SIZE = 16;
const XS_VALUE = 4;  // React Bootstrap Grid System


export default function Header() {
    const { logout, user } = useAuthContext();

    return (
        <Container className="w-100 m-1">
            <Row className="w-100 m-1">
                <Col xs={XS_VALUE} className="p-0">
                    {user &&
                        <div className="align-middle d-inline text-center">
                            {user?.profilePicture &&
                                <img
                                    alt={`${FEDIALGO} User Avatar`}
                                    className="align-middle d-inline-block"
                                    src={user.profilePicture}
                                    style={avatarStyle}
                                />}

                            <span style={usernameStyle}>
                                {user.username}
                            </span>
                        </div>}
                </Col>

                <Col xs={XS_VALUE} className="text-center p-0">
                    <img
                        className="align-middle d-inline-block"
                        src={config.app.headerIconUrl}
                        style={avatarStyle}
                    />

                    <span className="align-middle text-center p-2" style={fedialgoContainer}>
                        <a href={config.app.repoUrl} style={whiteFont} target="_blank">
                            Fedialgo Demo
                        </a>

                        {" "}<span style={versionParenthesesStyle}>(
                            <a href={config.app.changelogUrl} style={versionStyle} target="_blank">
                                v{process.env.FEDIALGO_VERSION}
                            </a>
                        )</span>
                    </span>
                </Col>

                <Col xs={XS_VALUE} className="text-end p-0">
                    {user &&
                        <Button
                            className="text-center p-2"
                            onClick={() => logout()}
                            size="sm"
                            variant="outline-danger"
                        >
                            Logout
                        </Button>}
                </Col>
            </Row>
        </Container>
    );
};


const avatarStyle: CSSProperties = {
    ...mildlyRoundedCorners,
    height: 30,
    width: 30,
};

const fedialgoContainer: CSSProperties = {
    fontSize: TITLE_FONT_SIZE,
    whiteSpace: "nowrap",
};

const usernameStyle: CSSProperties = {
    fontSize: TITLE_FONT_SIZE - 1,
    padding: 10
};

const versionStyle: CSSProperties = {
    color: "#bcccceff",
};

const versionParenthesesStyle: CSSProperties = {
    fontSize: TITLE_FONT_SIZE - 4,
    color: "lightgrey",
};
