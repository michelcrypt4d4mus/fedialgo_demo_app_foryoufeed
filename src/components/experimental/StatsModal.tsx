/*
 * Modal to display JSON data.
 * React Bootstrap Modal: https://getbootstrap.com/docs/5.0/components/modal/
 */
import React, { CSSProperties } from 'react';
import { Modal } from 'react-bootstrap';

import { DataKey } from 'recharts/types/util/types';
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MinMaxAvgScore, ScoreName, ScoreStats } from 'fedialgo';

import LabeledDropdownButton from '../helpers/LabeledDropdownButton';
import { FEED_BACKGROUND_COLOR, RECHARTS_COLORS } from '../../helpers/style_helpers';
import { formatScore } from '../../helpers/number_helpers';
import { ModalProps } from '../../types';
import { useAlgorithm } from '../../hooks/useAlgorithm';

const SCORE_TYPES: (keyof ScoreStats)[] = ["raw", "weighted"];
const VALUE_TYPES: (keyof MinMaxAvgScore)[] = ["average", "averageFinalScore", "min", "max"];


export default function StatsModal(props: ModalProps) {
    let { dialogClassName, show, setShow, title } = props;
    const { algorithm } = useAlgorithm();
    if (!algorithm) return <>   </>;

    const data = show ? algorithm.getRechartsStatsData(10) : [];
    const [hiddenLines, setHiddenLines] = React.useState<Array<DataKey<string | number>>>([]);
    const [scoreType, setScoreType] = React.useState<keyof ScoreStats>("weighted");
    const [valueType, setValueType] = React.useState<keyof MinMaxAvgScore>("average");

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
                <LabeledDropdownButton
                    initialLabel={"Raw or Weighted"}
                    onClick={(value) => setScoreType(value as keyof ScoreStats)}
                    options={SCORE_TYPES}
                    style={buttonStyle}
                />

                <LabeledDropdownButton
                    initialLabel={"Value Type"}
                    onClick={(value) => setValueType(value as keyof MinMaxAvgScore)}
                    options={VALUE_TYPES}
                    style={buttonStyle}
                />

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
                            contentStyle={{backgroundColor: "black"}}
                            labelStyle={{fontSize: 20, fontWeight: "bold"}}
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
                                    key={key}
                                    legendType='line'
                                    // isAnimationActive={false}
                                    stroke={RECHARTS_COLORS[i]}
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
