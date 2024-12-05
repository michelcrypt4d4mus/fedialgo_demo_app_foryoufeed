/*
 * Slider that sets a weight for the algorithm.
 */
import React from 'react';

import Form from 'react-bootstrap/esm/Form';
import { ScorerInfo, StringNumberDict } from "fedialgo";

const SCALE_MULTIPLIER = 1.2;
const DEFAULT_STEP_SIZE = 0.02;

interface WeightSliderProps {
    info: ScorerInfo;
    scoreName: string;
    updateWeights: (newWeights: StringNumberDict) => Promise<void>;
    userWeights: StringNumberDict;
};


export default function WeightSlider(props: WeightSliderProps) {
    const { info, scoreName, updateWeights, userWeights } = props;
    if (!userWeights[scoreName] && userWeights[scoreName] != 0) return <></>;

    const weightValues = Object.values(userWeights).filter(x => !isNaN(x)) ?? [0];
    const defaultMin = Math.min(...weightValues) - 1 * SCALE_MULTIPLIER;
    const defaultMax = Math.max(...weightValues) + 1 * SCALE_MULTIPLIER;
    const minValue = info.minValue ?? defaultMin;
    const decimals = (minValue > 0 && minValue < 0.01) ? 3 : 2;

    return (
        <Form.Group className="mb-1">
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                <div>
                    <span style={{fontWeight: 'bold'}}>
                        {`${scoreName}: `}
                    </span>

                    <span>{info.description}</span>
                </div>

                <div style={sliderValue}>
                    <span style={monoFont}>
                        {userWeights[scoreName]?.toFixed(decimals)}
                    </span>
                </div>
            </div>

            <Form.Range
                id={scoreName}
                min={minValue}
                max={defaultMax}
                onChange={async (e) => {
                    const newWeights = Object.assign({}, userWeights);
                    newWeights[scoreName] = Number(e.target.value);
                    await updateWeights(newWeights);
                }}
                step={info.stepSize || DEFAULT_STEP_SIZE}
                value={userWeights[scoreName]}
            />
        </Form.Group>
    );
};


const monoFont = {
    fontFamily: "AnonymousPro, Courier New, monospace",
    fontSize: "15px",
    fontWeight: 'bold',
};

const sliderValue = {
    alignSelf: 'end',
    backgroundColor: 'white',
    // color: 'white',
    border: "1px solid #000",
    borderColor: 'black',
    borderRadius: '3px',
    borderWidth: '1px',
    fontColor: 'white',
    paddingBottom: '2px',
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingTop: '2px',
};
