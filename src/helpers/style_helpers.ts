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

export type ThemeConfig = {
    accordionOpenBlue: CSSProperties['color'];
    favouritedTagGradient: GradientEndpoints;
    feedBackgroundColor: CSSProperties['backgroundColor'];  // TODO: change to GradientEndpoints
    feedBackgroundColorLite: CSSProperties['backgroundColor'];
    followedTagColor: CSSProperties['color'];
    followedUserColor: CSSProperties['color'];
    followedUserColorFaded: CSSProperties['color'];
    participatedTagColor: CSSProperties['color'];  // TODO: change to GradientEndpoints
    participatedTagColorMin: CSSProperties['color'];
    trendingObjFontSize: number;
    trendingTagColor: CSSProperties['color'];
    trendingTagColorFaded: CSSProperties['color'];
};

export const THEME: ThemeConfig = {
    accordionOpenBlue: "#7ac5cc", // Open accordion header color. NOTE THIS WILL NOT CHANGE THE CSS, it's at .accordion-button:not(.collapsed){
    favouritedTagGradient: [tinycolor("#cfe3e3"), tinycolor("cyan")], // Gradient for favourited tags
    feedBackgroundColor: '#15202b', // background color for the timeline
    feedBackgroundColorLite: '#bcddfd', // lighter background color for the application
    followedTagColor: 'yellow', // Color for followed tags
    followedUserColor: 'cyan', // Color for followed users
    followedUserColorFaded: '#2092a1', // Faded color for followed users
    participatedTagColor: '#92a14a', // Color for participated tags
    participatedTagColorMin: '#d8deb9', // Minimum color for participated tags
    trendingObjFontSize: 16, // Font size for trending objects
    trendingTagColor: 'firebrick', // Color for trending tags
    trendingTagColorFaded: '#f08c8c', // Faded color for trending tags
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
