/*
 * Slider that sets a weight for the algorithm.
 */
import React, { ChangeEvent, CSSProperties } from "react";
import Form from "react-bootstrap/esm/Form";

import { config } from "../../config";
import { monoFont, roundedCornersMild, whiteBackground } from "../../helpers/style_helpers";

interface SliderProps {
    description?: string;
    hideValueBox?: boolean;
    label: string;
    minValue: number;
    maxValue: number;
    onChange: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
    stepSize?: number;
    value: number;
    width?: string;
};


export default function Slider(props: SliderProps) {
    const { description, hideValueBox, label, minValue, maxValue, onChange, stepSize, value, width } = props;
    if (!value && value != 0) return;

    let step = stepSize ?? (minValue >= 0 ? config.weights.defaultStepSize : 1);
    let decimals = 2;

    if (stepSize == 1) {
        decimals = 0;
    } else if (minValue > 0 && minValue < 0.01) {
        decimals = 3;
    } else if (value >= 10.0) {
        decimals = 1;
    }

    let divs = [
        <div key={`${label}_label`} style={labelContainer}>
            {!hideValueBox &&
                <div style={sliderValue} id="innerest_doop">
                    <span style={sliderValueFont}>
                        {value?.toFixed(decimals)}
                    </span>
                </div>}

            <span>
                <span style={sliderFont}>
                    {`${label}` + (hideValueBox ? "" : ":")}
                </span>

                {description && <span>{description}</span>}
            </span>
        </div>,

        <div key={`${label}_slider`} style={sliderContainer}>
            <Form.Range
                className={"custom-slider"}
                id={label}
                min={minValue}
                max={maxValue}
                onChange={onChange}
                step={step}
                style={{width: width || "100%"}}
                value={value}
            />
        </div>,
    ];

    return (
        <Form.Group className="me-2" key={`${label}_sliderForm`}>
            <div style={{...labelContainer}}>
                {hideValueBox ? divs.reverse() : divs}
            </div>
        </Form.Group>
    );
};


const labelContainer: CSSProperties = {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    fontSize: 14,
    justifyContent: "space-between",
    textWrap: "nowrap",
};

const sliderContainer: CSSProperties = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "end",
};

const sliderFont: CSSProperties = {
    fontWeight: "bold",
    marginRight: "3px",
};

const sliderValue: CSSProperties = {
    ...roundedCornersMild,
    ...whiteBackground,
    alignSelf: "end",
    border: "1px solid #000",
    borderColor: "black",
    borderWidth: 1,
    marginRight: 10,
    // paddingBottom: "1px",
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 1,
};

const sliderValueFont: CSSProperties = {
    ...monoFont,
    fontSize: 12,
};
