/*
 * Types and methods for helping with tooltip coloring etc.
 */
import { CSSProperties } from "react";

import tinycolor from "tinycolor2";

import type { GradientEndpoints } from "./style_helpers";


export interface CheckboxGradientCfg {
    // Sometimes we want to adjust the gradient instead of using the one between the endpoints to make any of the
    // colors visible (e.g. when the user has one tag they participate in A LOT the rest will be undifferentiated)
    adjustment?: {
        adjustPctiles: number[];
        minTagsToAdjust: number;
    };
    endpoints: GradientEndpoints;
    textWithSuffix: (txt: string, n: number) => string;
};


// Two types unioned to create on XOR argument situation
type CheckboxColor = { color: CSSProperties["color"]; gradient?: never; };
type CheckboxGradientColor = { color?: never; gradient: CheckboxGradientCfg; };

export type CheckboxTooltipConfig = {
    anchor?: string;
    highlight?: CheckboxColor | CheckboxGradientColor; // Union type forces exactly one of 'color' or 'gradient'
    text: string;
};


// Same as CheckboxTooltipConfig but with the actual array of colors for the gradient
export interface CheckboxGradientTooltipConfig extends CheckboxTooltipConfig {
    colors: tinycolor.Instance[];
};


export type GuiCheckboxLabel = {
    readonly anchor?: string; // Optional anchor for the tooltip
    readonly label: string;
    readonly tooltipText: string;
};
