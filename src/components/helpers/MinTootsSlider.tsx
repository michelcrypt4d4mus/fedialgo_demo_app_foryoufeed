/*
 * Component for collecting a list of options for a BooleanFilter and displaying
 * them as checkboxes, with a switchbar for invertSelection, sortByCount, etc.
 */
import { useMemo, useState } from "react";

import { Tooltip } from "react-tooltip";
import { type ObjList } from "fedialgo";

import Slider from "../algorithm/Slider";
import { config } from "../../config";
import { getLogger } from "../../helpers/log_helpers";
import { tooltipZIndex } from "../../helpers/style_helpers";

interface MinTootsSliderProps {
    minTootsState: ReturnType<typeof useState<number>>;
    objList: ObjList;
    panelTitle: string;
    pluralizedPanelTitle?: string;
    showLongTitle?: boolean;
};


export default function MinTootsSlider(props: MinTootsSliderProps) {
    let { minTootsState, objList, panelTitle, pluralizedPanelTitle, showLongTitle } = props;
    pluralizedPanelTitle = (pluralizedPanelTitle || `${panelTitle}s`).toLowerCase();

    const logger = getMinTootsLogger(panelTitle);
    const booleanFiltersConfig = config.filters.boolean;
    const minTootsSliderCfg = booleanFiltersConfig.minTootsSlider;
    const tooltipAnchor = `${panelTitle}-min-toots-slider-tooltip`;

    const maxValue = useMemo(
        () => {
            if (objList.length === 0) {
                logger.info(`No tags found in objList, using default maxValue of 5`);
                return 5;
            }

            const topTags = objList.topObjs();
            const maxValueInTags = objList.maxNumToots;
            const maxValueOptionIdx = Math.min(minTootsSliderCfg.minItems, objList.length - 1);
            const maxValueOption = topTags[maxValueOptionIdx];
            let maxValue = maxValueOption?.numToots;

            if (!maxValue) {
                const msg = `No max found at maxValueOptionIdx ${maxValueOptionIdx} in ${topTags.length} objs,`;
                logger.warn(`${msg} using maxValueInTags: ${maxValueInTags}. Obj:`, maxValueOption);
                maxValue = maxValueInTags;
            }

            logger.trace(`Got maxValue ${maxValue} (maxValueInTags=${maxValueInTags}, maxValueOptionIdx=${maxValueOptionIdx})`);
            return maxValue;
        },
        [objList, objList.objs]
    );

    return (<>
        <Tooltip
            delayShow={minTootsSliderCfg.tooltipHoverDelay}
            id={tooltipAnchor}
            key={"minTootsTooltipAnchor-slider"}
            place="bottom"
            style={{...tooltipZIndex, fontWeight: "normal"}}
        />

        <div key={`${panelTitle}-minTootsSlider`} style={{width: "23%"}}>
            <a
                data-tooltip-id={tooltipAnchor}
                data-tooltip-content={`Hide ${pluralizedPanelTitle} with less than ${minTootsState[0]} toots`}
            >
                <Slider
                    hideValueBox={true}
                    label={showLongTitle ? "Minimum Number of Toots" : "Minimum"}
                    minValue={1}
                    maxValue={maxValue}
                    onChange={async (e) => minTootsState[1](parseInt(e.target.value))}
                    stepSize={1}
                    value={minTootsState[0]}
                    width={"80%"}
                />
            </a>
        </div>
    </>);
};


// Compute a starting value for the minToots slider based on the tagList. Outside of the main function
// because there's a few display options that depend on the initial value before the slider is rendered.
export const computeDefaultValue = (objList: ObjList, title: string, idealNumOptions?: number): number => {
    const logger = getMinTootsLogger(title);
    const minTootsSliderCfg = config.filters.boolean.minTootsSlider;
    idealNumOptions ||= minTootsSliderCfg.idealNumOptions;
    logger.deep(`Computing default value for minToots slider with ${objList.length} options`);

    // Don't show the slider if there are too few options
    if (objList.objs.length < (idealNumOptions - 1)) {
        return 0;
    } else {
        // It's "ideal" just in the sense that it has a value for numToots that works well
        const idealOption = objList.topObjs()[idealNumOptions];
        let sliderDefault = 0;

        if (!idealOption) {
            logger.warn(`No ideal option found to help set minToots slider default value`);
            sliderDefault = (objList.objs.length > (idealNumOptions / 2)) ? Math.floor(idealNumOptions / 10) : 0;
        } else {
            sliderDefault = idealOption.numToots;
        }

        // TODO: if the objList gets refreshed while the filter is set to a high value, the slider will disappear :(
        logger.trace(`Adjusted minToots slider default to ${sliderDefault} (${objList.length} tags)`);
        return sliderDefault;
    }
};


const getMinTootsLogger = (title: string) => getLogger("MinTootsSlider", title);
