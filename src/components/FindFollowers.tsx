import parse from 'html-react-parser';
import React, { useEffect, useState } from 'react';

import { mastodon } from 'masto';
import { Row, Col, Accordion, Button, Card } from 'react-bootstrap';

import { User } from '../types';

const NUM_SUGGESTIONS = 4;


export default function FindFollowers({ api, user }: { api: mastodon.rest.Client, user: User }) {
    const [suggestions, setSuggestions] = useState<mastodon.v1.Suggestion[]>([])
    const [open, setOpen] = useState<boolean>(false)

    useEffect(() => {
        if (!open || suggestions.length > 0) return;

        api.v2.suggestions.list().then((res) => {
            setSuggestions(res);
        });
    }, [open])

    const follow = (id: string) => {
        api.v1.accounts.$select(id).follow().then(() => {
            setSuggestions(
                suggestions.filter((suggestion: mastodon.v1.Suggestion) => suggestion.account.id !== id)
            );
        })
    }

    const hide = (id: string) => {
        api.v1.suggestions.$select(id).remove(id).then(() => {
            setSuggestions(
                suggestions.filter((suggestion: mastodon.v1.Suggestion) => suggestion.account.id !== id)
            );
        });
    }

    return (
        <Accordion>
            <Accordion.Item eventKey="0" >
                <Accordion.Header>Find Followers</Accordion.Header>
                <Accordion.Body onEnter={() => setOpen(true)}>
                    <Row className="g-4 m-3">
                        {suggestions.length == 0 && (
                            <div>If this does not work, log out and login again</div>
                        )}

                        {suggestions.filter((suggestion: mastodon.v1.Suggestion) => suggestion.source === "past_interactions")
                            .slice(0, NUM_SUGGESTIONS)
                            .map((suggestion: mastodon.v1.Suggestion, index: number) => (
                                <Col key={index} sm={12} md={6}>
                                    <Card className="h-100 shadow-sm">
                                        <Card.Body className="d-flex flex-column">
                                            <a
                                                href={`https://${user.server}/@${suggestion.account.acct}`}
                                                rel="noreferrer"
                                                style={{ textDecoration: 'none' }}
                                                target="_blank"
                                            >
                                                <div className="d-flex align-items-center mb-3">
                                                    <img
                                                        alt="Avatar"
                                                        className="rounded-circle me-3"
                                                        src={suggestion.account.avatar}
                                                        style={{ width: '60px', height: '60px' }}
                                                    />

                                                    <div>
                                                        <Card.Title className="mb-0">
                                                            {suggestion.account.displayName}
                                                        </Card.Title>

                                                        <Card.Text className="text-muted small">
                                                            @{suggestion.account.acct}
                                                        </Card.Text>
                                                    </div>
                                                </div>
                                            </a>

                                            <Card.Text className="flex-grow-1">
                                                {parse(suggestion.account.note)}
                                            </Card.Text>

                                            <div className="mt-3">
                                                <Button
                                                    variant="primary"
                                                    className="me-2"
                                                    onClick={() => follow(suggestion.account.id)}
                                                >
                                                    Follow
                                                </Button>

                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => hide(suggestion.account.id)}
                                                >
                                                    Hide
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>

                            ))
                        }
                    </Row>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};
