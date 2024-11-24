/*
 * Modal that shows all the elements of a toot's final score.
 */
import React from 'react';
import { Modal } from 'react-bootstrap';

import { Toot, extractScoreInfo } from 'fedialgo';
import { describeAccount } from 'fedialgo/dist/helpers';


export default function ScoreModal({
    setShowScoreModal,
    showScoreModal,
    toot
}: {
    setShowScoreModal: (showScoreModal: boolean) => void,
    showScoreModal: boolean,
    toot: Toot
}) {
    console.debug(`ScoreModal for #${toot.id}: `, toot);
    console.debug(`extractScoreInfo() for toot #${toot.id}: `, extractScoreInfo(toot));

    return (
        <Modal show={showScoreModal} onHide={() => setShowScoreModal(false)} style={{ color: "black" }}>
            <Modal.Header closeButton>
                <Modal.Title>This Toot's Score</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div style={{marginBottom: "10px"}}>
                    <p style={headerFont}>Computed Weight: {toot.value}</p>
                    <p>Posted by {describeAccount(toot)}</p>
                </div>

                <p>
                    <code style={{whiteSpace: 'pre'}}>
                        {JSON.stringify(extractScoreInfo(toot), null, 4)}
                    </code>
                </p>
            </Modal.Body>
        </Modal>
    );
};


const headerFont = {
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "5px",
};
