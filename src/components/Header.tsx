/*
 * Header component on the feed page.
 */
import { Button, Col, Container, Row } from 'react-bootstrap';
import { CSSProperties } from 'react';

import { config } from '../config';
import { useAuthContext } from "../hooks/useAuth";

const XS_VALUE = 4;  // React Bootstrap Grid System


export default function Header() {
    const { logout, user } = useAuthContext();

    return (
        <Container className='w-100 m-1'>
            <Row className='w-100 m-1'>
                <Col xs={XS_VALUE} className="p-0">
                    {user &&
                        <div className='text-center d-inline align-middle'>
                            {user?.profilePicture &&
                                <img
                                    alt="Avatar"
                                    className="d-inline-block align-middle"
                                    src={user.profilePicture}
                                    style={avatarStyle}
                                />}

                            <span style={{fontSize: 15, padding: 10}}>
                                {user.username}
                            </span>
                        </div>}
                </Col>

                <Col xs={XS_VALUE} className='text-center p-0'>
                    <img
                        className="d-inline-block align-middle"
                        src={config.app.headerIconUrl}
                        style={avatarStyle}
                    />

                    <span
                        className='text-center align-middle p-2'
                        style={{fontSize: 16, whiteSpace: "nowrap"}}
                    >
                        <a href={config.app.repoUrl} style={{color: "white"}} target="_blank">
                            Fedialgo Demo
                        </a>

                        {' '}<span style={{color: "lightgrey", fontSize: 10}}>(
                            <a href={config.app.changelogUrl} style={{color: "grey"}} target="_blank">
                                v{process.env.FEDIALGO_VERSION}
                            </a>
                        )</span>
                    </span>
                </Col>

                <Col xs={XS_VALUE} className='text-end p-0'>
                    {user &&
                        <Button className='p-2 text-center' variant="outline-primary" onClick={logout}>
                            Logout
                        </Button>}
                </Col>
            </Row>
        </Container>
    );
};


const avatarStyle: CSSProperties = {
    borderRadius: 5,
    height: 30,
    width: 30,
};
