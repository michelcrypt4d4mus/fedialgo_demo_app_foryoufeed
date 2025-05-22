/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import React, { CSSProperties, useState, useEffect } from "react";

import { NonScoreWeightName, WeightName, type Weights } from "fedialgo";

import LabeledDropdownButton from "../helpers/LabeledDropdownButton";
import TopLevelAccordion from "../helpers/TopLevelAccordion";
import WeightSlider from './WeightSlider';
import { logMsg } from "../../helpers/string_helpers";
import { roundedBox, titleStyle } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";

const PRESET_MENU_TITLE = "Preset Algorithm Configurations";


export default function WeightSetter() {
    const { algorithm, setError } = useAlgorithm();
    const [userWeights, setUserWeights] = useState<Weights>({} as Weights);
    const sortedScorers = algorithm.weightedScorers.sort((a, b) => a.name.localeCompare(b.name));

    const initWeights = async () => setUserWeights(await algorithm.getUserWeights());
    useEffect(() => {initWeights()}, []);

    // Update the user weightings stored in TheAlgorithm when a user moves a weight slider
    const updateWeights = async (newWeights: Weights): Promise<void> => {
        try {
            logMsg(`updateWeights() called with:`, newWeights);
            setUserWeights(newWeights);  // Note lack of await here
            algorithm.updateUserWeights(newWeights);
        } catch (error) {
            setError(`${error?.message || error}`);
        }
    };

    const updateWeightsToPreset = async (preset: string): Promise<void> => {
        try {
            logMsg(`updateWeightsToPreset() called with:`, preset);
            await algorithm.updateUserWeightsToPreset(preset);
            setUserWeights(await algorithm.getUserWeights());
        } catch (error) {
            setError(`${error?.message || error}`);
        }
    };

    const weightSlider = (scoreName: WeightName) => (
        <WeightSlider
            key={scoreName}
            scoreName={scoreName}
            updateWeights={updateWeights}
            userWeights={userWeights}
        />
    );

    return (
        <TopLevelAccordion title={"Feed Algorithm Control Panel"}>
            <LabeledDropdownButton
                id="presetWeights"
                initialLabel={PRESET_MENU_TITLE}
                onClick={updateWeightsToPreset}
                options={Object.keys(algorithm.weightPresets)}
            />

            {Object.values(NonScoreWeightName).map((weight) => weightSlider(weight))}
            <div style={{height: '12px'}} />

            <div style={roundedBox}>
                <p style={weightingsStyle}>
                    Weightings
                </p>

                {sortedScorers.map((scorer) => weightSlider(scorer.name))}
            </div>
        </TopLevelAccordion>
    );
};


const weightingsStyle: CSSProperties = {
    ...titleStyle,
    marginBottom: "15px",
    marginTop: "-5px",
};
