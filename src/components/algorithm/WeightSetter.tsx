/*
 * Component for setting the user's preferred weightings of various post properties.
 * Things like how much to prefer people you favorite a lot or how much to posts that
 * are trending in the Fedivers.
 */
import { CSSProperties, useState, useEffect } from "react";

import { type Weights, NonScoreWeightName, WeightName } from "fedialgo";

import LabeledDropdownButton from "../helpers/LabeledDropdownButton";
import TopLevelAccordion from "../helpers/TopLevelAccordion";
import WeightSlider from './WeightSlider';
import { config } from "../../config";
import { getLogger } from "../../helpers/log_helpers";
import { roundedBox, titleStyle } from "../../helpers/style_helpers";
import { useAlgorithm } from "../../hooks/useAlgorithm";
import { useError } from "../helpers/ErrorHandler";

const logger = getLogger("WeightSetter");


export default function WeightSetter() {
    const { algorithm } = useAlgorithm();
    const { logAndSetError } = useError();

    const [userWeights, setUserWeights] = useState<Weights>({} as Weights);
    const sortedScorers = algorithm.weightedScorers.sort((a, b) => a.name.localeCompare(b.name));

    const initWeights = async () => setUserWeights(await algorithm.getUserWeights());
    useEffect(() => {initWeights()}, []);

    // Update the user weightings stored in TheAlgorithm when a user moves a weight slider
    const updateWeights = async (newWeights: Weights): Promise<void> => {
        try {
            logger.log(`updateWeights() called with:`, newWeights);
            setUserWeights(newWeights);  // Note lack of await here
            algorithm.updateUserWeights(newWeights);
        } catch (error) {
            logAndSetError(logger, error);
        }
    };

    const updateWeightsToPreset = async (preset: string): Promise<void> => {
        try {
            logger.log(`updateWeightsToPreset() called with:`, preset);
            await algorithm.updateUserWeightsToPreset(preset);
            setUserWeights(await algorithm.getUserWeights());
        } catch (error) {
            logAndSetError(logger, error);
        }
    };

    const makeWeightSlider = (scoreName: WeightName) => (
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
                initialLabel={config.weights.presetMenuLabel}
                onClick={updateWeightsToPreset}
                options={Object.keys(algorithm.weightPresets)}
            />

            {Object.values(NonScoreWeightName).map((weight) => makeWeightSlider(weight))}
            <div style={{height: '12px'}} />

            <div style={roundedBox}>
                <p style={weightingsStyle}>
                    Weightings
                </p>

                {sortedScorers.map((scorer) => makeWeightSlider(scorer.name))}
            </div>
        </TopLevelAccordion>
    );
};


const weightingsStyle: CSSProperties = {
    ...titleStyle,
    marginBottom: "10px",
};
