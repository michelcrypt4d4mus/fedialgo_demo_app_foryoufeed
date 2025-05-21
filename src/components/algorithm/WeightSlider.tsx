/*
 * Slider that sets a weight for the algorithm.
 */
import React from 'react';

import Slider, { DEFAULT_STEP_SIZE } from './Slider';
import { type StringNumberDict, type WeightName } from "fedialgo";
import { useAlgorithm } from '../../hooks/useAlgorithm';

const SCALE_MULTIPLIER = 1.2;

interface WeightSliderProps {
    scoreName: WeightName;
    updateWeights: (newWeights: StringNumberDict) => Promise<void>;
    userWeights: StringNumberDict;
};


export default function WeightSlider(props: WeightSliderProps) {
    const { scoreName, updateWeights, userWeights } = props;
    const { algorithm } = useAlgorithm();

    if (!userWeights[scoreName] && userWeights[scoreName] != 0) return <></>;
    const info = algorithm.weightInfo[scoreName];

    const weightValues = Object.values(userWeights).filter(x => !isNaN(x)) ?? [0];
    const defaultMin = Math.min(...weightValues) - 1 * SCALE_MULTIPLIER;
    const defaultMax = Math.max(...weightValues) + 1 * SCALE_MULTIPLIER;
    const minValue = info.minValue ?? defaultMin;

    return (
        <Slider
            description={info.description}
            key={scoreName}
            label={scoreName}
            minValue={minValue}
            maxValue={defaultMax}
            onChange={async (e) => {
                const newWeights = Object.assign({}, userWeights);
                newWeights[scoreName] = Number(e.target.value);
                await updateWeights(newWeights);
            }}
            stepSize={(info.minValue && info.minValue < DEFAULT_STEP_SIZE) ? minValue : DEFAULT_STEP_SIZE}
            value={userWeights[scoreName]}
        />
    );
};
