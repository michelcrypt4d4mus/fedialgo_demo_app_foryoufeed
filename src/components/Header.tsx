import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { Container } from 'react-bootstrap';

import { useAuth } from "../hooks/useAuth";


export default function Header() {
    const { user } = useAuth();

    return (
        <Container className='w-100 m-3'>
            <Row className='w-100 m-3'>
                <Col xs={4} className="p-0">
                    {
                        user && <div className='text-center d-inline align-middle'>
                            {user?.profilePicture && <img src={user.profilePicture} alt="Avatar" style={{ height: 30, width: 30, borderRadius: 5 }} className="d-inline-block align-top" />}
                            <span style={{ fontSize: 15, padding: 10 }}>{user.username}</span>
                        </div>
                    }
                </Col>
                <Col xs={4} className='text-center p-0'>
                    <img src={"/assets/logo.png"} style={{ height: 20, width: 20, borderRadius: 5 }} className="d-inline-block align-top" />
                    <span className='text-center align-middle p-2' style={{ fontSize: 20, whiteSpace: "nowrap" }}>Fedi-Feed</span>
                </Col>

                <Col className='text-end p-0'>
                    {user && <Button className='p-2 text-center' variant="outline-primary" href="/logout">Logout</Button>}
                </Col>
            </Row>
        </Container>
    )
};
