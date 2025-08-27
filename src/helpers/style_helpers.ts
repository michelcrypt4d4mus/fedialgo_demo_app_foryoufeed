/*
 * Reusable CSS.
 * CSS color keywords:https://www.w3.org/wiki/CSS/Properties/color/keywords
 * Color blender tool: https://meyerweb.com/eric/tools/color-blend/#D3D3D3:FCBA03:5:hex
 */
import { CSSProperties } from "react";

import tinycolor from "tinycolor2";
import tinygradient from "tinygradient";

import { DEFAULT_FONT_SIZE } from "fedialgo";

// TODO: Can't live in FilterCheckbox.tsx because of circular dependency
export enum SwitchType {
    HIGHLIGHTS_ONLY = "highlightsOnly",
    INVERT_SELECTION = "invertSelection",
    SORT_BY_COUNT = "sortByCount"
};

export type GradientEndpoints = [tinycolor.Instance, tinycolor.Instance];

interface ThemeConfigBase {
    // Colors
    readonly accordionOpenBlue: CSSProperties['color'];
    readonly followedTagColor: CSSProperties['color'];
    // Gradients
    readonly favouritedTagGradient: GradientEndpoints;
    readonly feedBackgrounGradient: GradientEndpoints;
    readonly followedUserGradient: GradientEndpoints,
    readonly participatedTagGradient: GradientEndpoints;
    readonly trendingTagGradient: GradientEndpoints;
    // Fonts
    readonly accountBioFontSize?: number;  // Font size for account bios
    readonly defaultFontSize: number;
    readonly retooterFontSize: number;
    readonly trendingObjFontSize: number;
};

export interface ThemeConfig extends ThemeConfigBase {
    readonly favouritedTagColor: CSSProperties["color"];
    readonly feedBackgroundColor: CSSProperties["backgroundColor"];
    readonly feedBackgroundColorLite: CSSProperties["backgroundColor"];
    readonly trendingTagColor: CSSProperties["color"];
    readonly participatedTagColor: CSSProperties["color"];
    readonly followedUserColor: CSSProperties["color"];
}


// Color blender tool: https://meyerweb.com/eric/tools/color-blend/#D3D3D3:FCBA03:5:hex
const THEME_BASE: ThemeConfigBase = {
    // Colors
    accordionOpenBlue: "#7ac5cc",  // Open accordion header color. THIS DOESN'T CHANGE THE CSS which is at '.accordion-button:not(.collapsed)'
    followedTagColor: 'cyan',
    // Gradients
    favouritedTagGradient: [tinycolor("#C4DABE"), tinycolor("#fdff83")],    // Gradient for favourited tags
    feedBackgrounGradient: [tinycolor('#bcddfd'), tinycolor('#15202b')],    // Gradient for the feed background
    followedUserGradient: [tinycolor("#BCD8D8"), tinycolor('cyan')],          // Gradient for followed users
    participatedTagGradient: [tinycolor('#d8deb9'), tinycolor('#92a14a')],  // Gradient for participated tags
    trendingTagGradient: [tinycolor('#C89898'), tinycolor('#B84040')],      // Gradient for trending tags
    // Fonts
    accountBioFontSize: 13,                        // Font size used in the account bio hover box
    defaultFontSize: DEFAULT_FONT_SIZE,            // Emoji font size for account display names
    retooterFontSize: DEFAULT_FONT_SIZE,           // Emoji font size for retooters' display names
    trendingObjFontSize: DEFAULT_FONT_SIZE + 1,    // Emoji font size for trending objects
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


// Colors used for the 'recharts' package's animated charts - cycle through these for multiple lines/pies/etc.
// "yellow" is too light to see well on white background. "navy" also sucks.
export const RECHARTS_COLORS: CSSProperties["color"][] = [
    "red",
    "orange",
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
