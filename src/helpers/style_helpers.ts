/*
 * Reusable CSS.
 * CSS color keywords:https://www.w3.org/wiki/CSS/Properties/color/keywords
 */
import { CSSProperties } from "react";

import tinycolor from "tinycolor2";
import tinygradient from "tinygradient";

// Can't live in FilterCheckbox.tsx because of circular dependency
export enum SwitchType {
    HIGHLIGHTS_ONLY = "highlightsOnly",
    INVERT_SELECTION = "invertSelection",
    SORT_BY_COUNT = "sortByCount"
};

export type GradientEndpoints = [tinycolor.Instance, tinycolor.Instance];

interface ThemeConfigBase {
    readonly accordionOpenBlue: CSSProperties['color'];
    readonly favouritedTagGradient: GradientEndpoints;
    readonly feedBackgrounGradient: GradientEndpoints;
    readonly followedTagColor: CSSProperties['color'];
    readonly followedUserGradient: GradientEndpoints,
    readonly participatedTagGradient: GradientEndpoints;
    readonly trendingObjFontSize: number;
    readonly trendingTagGradient: GradientEndpoints;
};

export interface ThemeConfig extends ThemeConfigBase {
    readonly favouritedTagColor: CSSProperties["color"];
    readonly feedBackgroundColor: CSSProperties["backgroundColor"];
    readonly feedBackgroundColorLite: CSSProperties["backgroundColor"];
    readonly trendingTagColor: CSSProperties["color"];
    readonly participatedTagColor: CSSProperties["color"];
    readonly followedUserColor: CSSProperties["color"];
}


// Color blender: https://meyerweb.com/eric/tools/color-blend/#D3D3D3:FCBA03:5:hex
const THEME_BASE: ThemeConfigBase = {
    accordionOpenBlue: "#7ac5cc", // Open accordion header color. NOTE THIS WILL NOT CHANGE THE CSS, it's at .accordion-button:not(.collapsed){
    favouritedTagGradient: [tinycolor("#C4DABE"), tinycolor("#fdff83")],
    feedBackgrounGradient: [tinycolor('#bcddfd'), tinycolor('#15202b')], // Gradient for the feed background
    followedTagColor: 'cyan',
    followedUserGradient: [tinycolor("#BCD8D8"), tinycolor('cyan')],
    participatedTagGradient: [tinycolor('#d8deb9'), tinycolor('#92a14a')],
    trendingObjFontSize: 16,    // Font size for trending objects
    trendingTagGradient: [tinycolor('#C89898'), tinycolor('#B84040')],
};

// Fill in a few extra colors that are the last color in the gradients as a convenience
export const THEME: ThemeConfig = {
    ...THEME_BASE,
    favouritedTagColor: THEME_BASE.favouritedTagGradient.slice(-1)[0].toHexString(),
    feedBackgroundColor: THEME_BASE.feedBackgrounGradient[1].toHexString(),
    feedBackgroundColorLite: THEME_BASE.feedBackgrounGradient[0].toHexString(),
    followedUserColor: THEME_BASE.followedUserGradient.slice(-1)[0].toHexString(),
    participatedTagColor: THEME_BASE.participatedTagGradient.slice(-1)[0].toHexString(),
    trendingTagColor: THEME_BASE.trendingTagGradient.slice(-1)[0].toHexString(),
};

export const RECHARTS_COLORS: CSSProperties["color"][] = [
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


// Wrap middleColors in endpoints and generate a tinygradient (see docs for details)
export function buildGradient(
    endpoints: [tinycolor.Instance, tinycolor.Instance],
    middleColors?: tinycolor.Instance[]
): tinygradient.Instance {
    const gradientPoints = [endpoints[0], ...(middleColors || []), endpoints[1]];
    return tinygradient(...gradientPoints);
};


///////////////////////////////
// CSS Properties Below Here //
///////////////////////////////

export const accordionBody: CSSProperties = {
    backgroundColor: '#b2bfd4',
};

export const accordionSubheader: CSSProperties = {
    // marginBottom: "7px",
    marginLeft: "7px",
    padding: "7px",
};

export const globalFont: CSSProperties = {
    color: "black",
    fontFamily: "Tahoma, Geneva, sans-serif",
};

export const headerFont: CSSProperties = {
    ...globalFont,
    fontSize: 15,
    fontWeight: 800,
    marginLeft: "15px",
    marginBottom: "0px",
    marginTop: "0px",
};

export const linkesque: CSSProperties = {
    cursor: "pointer",
    textDecoration: "underline",
};

export const noPadding: CSSProperties = {
    padding: "0px",
};

export const paddingBorder: CSSProperties = {
    padding: "2px",
};

export const rawErrorContainer: CSSProperties = {
    backgroundColor: "black",
    borderRadius: "10px",
    fontFamily: "monospace",
    marginTop: "15px",
    minHeight: "120px",
    padding: "35px",
};

export const roundedBox: CSSProperties = {
    borderRadius: "20px",
    background: "lightgrey",
    paddingLeft: "25px",
    paddingRight: "20px",
    paddingBottom: "13px",
    paddingTop: "15px",
};

export const titleStyle: CSSProperties = {
    ...globalFont,
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: "5px",
    marginLeft: "5px",
    marginTop: "0px",
    textDecoration: "underline",
};

export const tooltipZIndex: CSSProperties = {
    zIndex: 2000,
};
