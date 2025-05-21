/*
 * Modal to display JSON data.
 * React Bootstrap Modal: https://getbootstrap.com/docs/5.0/components/modal/
 */
import React, { CSSProperties } from 'react';

import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { DataKey } from 'recharts/types/util/types';
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Modal } from 'react-bootstrap';
import { MinMaxAvg, ScoreName, ScoreStats, formatScore } from 'fedialgo';

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
    // "navy",
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

// TODO: this sucks, these are keys of MinMaxAvg types and ScoreStats
const SCORE_TYPES: (keyof ScoreStats)[] = ["raw", "weighted"];
const VALUE_TYPES: (keyof MinMaxAvg)[] = ["average", "min", "max"];


export default function StatsModal(props: StatsModalProps) {
    let { dialogClassName, show, setShow, title } = props;
    const { algorithm } = useAlgorithm();
    if (!algorithm) return <>   </>;

    const data = show ? algorithm.getRechartsStatsData(10) : [];
    const [hiddenLines, setHiddenLines] = React.useState<Array<DataKey<string | number>>>([]);
    const [scoreType, setScoreType] = React.useState<keyof ScoreStats>("weighted");
    const [valueType, setValueType] = React.useState<keyof MinMaxAvg>("average");

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
                <DropdownButton id="scoreType" title={"Raw or Weighted"} style={buttonStyle} variant="info">
                    {SCORE_TYPES.map((scoreType) => (
                        <Dropdown.Item key={scoreType} onClick={() => setScoreType(scoreType)} >
                            {scoreType}
                        </Dropdown.Item>
                    ))}
                </DropdownButton>

                <DropdownButton id="valueType" title={"Value Type"} style={buttonStyle} variant="info">
                    {VALUE_TYPES.map((valueType) => (
                        <Dropdown.Item key={valueType} onClick={() => setValueType(valueType)} >
                            {valueType}
                        </Dropdown.Item>
                    ))}
                </DropdownButton>

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
                        <Tooltip
                            formatter={(value, name) => [formatScore(Number(value)), (name as string).split('_')[0]]}
                        />

                        <Legend
                            formatter={(value, entry, i) => value.split('_')[0]}
                            onClick={props => handleLegendClick(props.dataKey)}
                        />

                        {Object.values(ScoreName).map((scoreName, i) => {
                            const key = `${scoreName}_${scoreType}_${valueType}`;

                            return (
                                <Line
                                    animationDuration={500}
                                    dataKey={key}
                                    hide={hiddenLines.includes(key)}
                                    legendType='line'
                                    // isAnimationActive={false}
                                    stroke={COLORS[i]}
                                    strokeWidth={2}
                                />
                            );})}
                    </LineChart>
                </ResponsiveContainer>
            </Modal.Body>
        </Modal>
    );
};


const buttonStyle: CSSProperties = {
    marginBottom: "5px",
    marginRight: "10px",
    marginTop: "-10px",
};

const charStyle: CSSProperties = {
    backgroundColor: FEED_BACKGROUND_COLOR,
    borderRadius: "15px",
}

const textStyle: CSSProperties = {
    color: "black",
};
