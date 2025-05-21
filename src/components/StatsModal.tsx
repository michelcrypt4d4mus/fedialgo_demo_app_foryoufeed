/*
 * Modal to display JSON data.
 * React Bootstrap Modal: https://getbootstrap.com/docs/5.0/components/modal/
 */
import React, { CSSProperties } from 'react';

import { DataKey } from 'recharts/types/util/types';
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Modal } from 'react-bootstrap';
import { ScoreName } from 'fedialgo';

import { FEED_BACKGROUND_COLOR } from '../helpers/style_helpers';
import { ModalProps } from 'react-bootstrap';
import { useAlgorithm } from '../hooks/useAlgorithm';

const COLORS: CSSProperties["color"][] = [
    "red",
    "orange",
    // "yellow",
    "green",
    "blue",
    "purple",
    "pink",
    "brown",
    "grey",
    "fuchsia",
    "lime",
    "cyan",
    "bisque",
    "navy",
    "orangered",
    "skyblue",
    "rosybrown",
    "olive",
    "mediumvioletred",
    "lightgoldenrodyellow",
    "gold",
    "crimson",
];

interface StatsModalProps extends ModalProps {
};


export default function StatsModal(props: StatsModalProps) {
    let { dialogClassName, show, setShow, title } = props;
    const { algorithm } = useAlgorithm();
    if (!algorithm) return <>   </>;

    const data = show ? algorithm.getRechartsStatsData(10) : [];
    const [hiddenLines, setHiddenLines] = React.useState<Array<DataKey<string | number>>>([]);

    const handleLegendClick = (dataKey: DataKey<string | number>) => {
        if (hiddenLines.includes(dataKey)) {
            setHiddenLines(hiddenLines.filter(el => el !== dataKey));
        } else {
            setHiddenLines(prev => [...prev, dataKey]);
        }
    };

    return (
        <Modal
            dialogClassName={dialogClassName || "modal-xl"}
            onHide={() => setShow(false)}
            show={show}
        >
            <Modal.Header closeButton style={textStyle}>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body >
                <ResponsiveContainer height={600} width="100%">
                    <LineChart
                        data={data}
                        height={900}
                        width={1000}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                        style={charStyle}
                    >
                        {/* <CartesianGrid strokeDasharray="3 3" /> */}
                        <XAxis dataKey="segment" />
                        <YAxis />
                        <Tooltip />
                        <Legend onClick={props => handleLegendClick(props.dataKey as string)}/>

                        {Object.values(ScoreName).map((scoreName, i) => (
                            <Line
                                animationDuration={500}
                                dataKey={`${scoreName}_weighted_average`}
                                hide={hiddenLines.includes(`${scoreName}_weighted_average`)}
                                legendType='line'
                                // isAnimationActive={false}
                                stroke={COLORS[i]}
                                strokeWidth={2}
                            />))}
                    </LineChart>
                </ResponsiveContainer>
            </Modal.Body>
        </Modal>
    );
};


const charStyle: CSSProperties = {
    backgroundColor: FEED_BACKGROUND_COLOR,
    borderRadius: "15px",
    padding: "10px",
}

const textStyle: CSSProperties = {
    color: "black",
};
