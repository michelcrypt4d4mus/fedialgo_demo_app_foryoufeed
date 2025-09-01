import React, { CSSProperties, useEffect, useState } from "react";

import parse from "html-react-parser";
import { Accordion, Button, Card, Col, Row } from "react-bootstrap";
import { mastodon } from "masto";

import LoadingSpinner from "../helpers/LoadingSpinner";
import { getLogger } from "../../helpers/log_helpers";
import { loadingMsgStyle } from "../../helpers/style_helpers";
import { titleStyle } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";
import { useAuthContext } from "../../hooks/useAuth";

const NUM_SUGGESTIONS = 4;

const logger = getLogger("FindFollowers");


export default function FindFollowers(): React.ReactElement {
    const { user } = useAuthContext();
    const { api } = useAlgorithm();

    const [isFinding, setIsFinding] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const [suggestions, setSuggestions] = useState<mastodon.v1.Suggestion[]>([]);

    useEffect(() => {
        if (!open || suggestions.length > 0) return;
        setIsFinding(true);

        (Promise.resolve(api.v2.suggestions.list()) as Promise<mastodon.v1.Suggestion[]>)
            .then((res) => {
                logger.debug("Fetched suggestions:", res);
                setSuggestions(res);
            })
            .catch((err) => {
                logger.error("Error fetching suggestions:", err);
            })
            .finally(() => {
                setIsFinding(false);
            });
    }, [open]);

    const follow = (id: string) => {
        api.v1.accounts.$select(id).follow().then(() => {
            setSuggestions(
                suggestions.filter((suggestion: mastodon.v1.Suggestion) => suggestion.account.id !== id)
            );
        });
    };

    const hide = (id: string) => {
        api.v1.suggestions.$select(id).remove(id).then(() => {
            setSuggestions(
                suggestions.filter((suggestion: mastodon.v1.Suggestion) => suggestion.account.id !== id)
            );
        });
    };

    return (
        <Accordion style={accordionStyle}>
            <Accordion.Item eventKey="findfollowers">
                <Accordion.Header>
                    <p style={titleStyle}>
                        Find Followers
                    </p>
                </Accordion.Header>

                <Accordion.Body onEnter={() => setOpen(true)}>
                    <Row className="g-4 m-3">
                        {suggestions.length == 0 &&
                            <div>
                                {isFinding && <LoadingSpinner message={`Finding followers...`} style={loadingMsgStyle} />}
                                <br/>
                                If this does not work, log out and login again
                            </div>}

                        {suggestions
                            .filter((suggestion: mastodon.v1.Suggestion) => suggestion.source === "past_interactions")
                            .slice(0, NUM_SUGGESTIONS)
                            .map((suggestion: mastodon.v1.Suggestion, index: number) => (
                                <Col key={index} sm={12} md={6}>
                                    <Card className="h-100 shadow-sm">
                                        <Card.Body className="d-flex flex-column">
                                            <a
                                                href={`${user.server}/@${suggestion.account.acct}`}
                                                rel="noreferrer"
                                                style={{textDecoration: "none"}}
                                                target="_blank"
                                            >
                                                <div className="d-flex align-items-center mb-3">
                                                    <img
                                                        alt="Avatar"
                                                        className="rounded-circle me-3"
                                                        src={suggestion.account.avatar}
                                                        style={{height: "60px", width: "60px"}}
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
                                                    className="me-2"
                                                    onClick={() => follow(suggestion.account.id)}
                                                    variant="primary"
                                                >
                                                    Follow
                                                </Button>

                                                <Button
                                                    onClick={() => hide(suggestion.account.id)}
                                                    variant="outline-secondary"
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


const accordionStyle: CSSProperties = {
    marginTop: "10px",
};
