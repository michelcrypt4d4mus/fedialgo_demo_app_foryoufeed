/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties, useCallback, useMemo, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import { type TagWithUsageCounts, type TrendingLink, type TrendingWithHistory, extractDomain } from "fedialgo";

import StatusComponent from "./status/Status";
import SubAccordion from "./helpers/SubAccordion";
import TopLevelAccordion from "./helpers/TopLevelAccordion";
import TrendingSection, { LINK_FONT_SIZE } from "./TrendingSection";
import { ComponentLogger } from "../helpers/log_helpers";
import { followUri, openTrendingLink } from "../helpers/react_helpers";
import { IMAGE_BACKGROUND_COLOR, accordionSubheader, linkesque, noPadding } from "../helpers/style_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";

const DEFAULT_MAX_HASHTAGS_TO_SHOW = 100;
const logger = new ComponentLogger("TrendingInfo");


export default function TrendingInfo() {
    const { algorithm } = useAlgorithm();
    const [maxHashtagsToShow, setMaxHashtagsToShow] = useState(DEFAULT_MAX_HASHTAGS_TO_SHOW);

    // React profiler said the trending sections was the most expensive component to render, so memoize the pieces
    const trendingTagsSection = useMemo(
        () => (
            <TrendingSection
                title="Hashtags"
                infoTxt={trendingObjInfoTxt}
                key={"hashtags"}
                linkLabel={tagNameMapper}
                linkUrl={linkMapper}
                multicolumn={true}
                onClick={openTrendingLink}
                trendingObjs={algorithm.trendingData.tags}
            />
        ),
        [algorithm.trendingData.tags]
    );

    const trendingLinksSection = useMemo(
        () => (
            <TrendingSection
                title="Links"
                hasCustomStyle={true}
                key={"links"}
                infoTxt={trendingObjInfoTxt}
                linkLabel={(link: TrendingLink) => prefixedHtml(link.title, extractDomain(link.url))}
                linkUrl={linkMapper}
                onClick={openTrendingLink}
                trendingObjs={algorithm.trendingData.links}
            />
        ),
        [algorithm.trendingData.links]
    );

    const trendingTootSection = useMemo(
        () => (
            <SubAccordion key={"toots"} title={"Toots"}>
                {algorithm.trendingData.toots.map((toot) => (
                    <StatusComponent
                        fontColor="black"
                        hideLinkPreviews={false}
                        key={toot.uri}
                        status={toot}
                    />
                ))}
            </SubAccordion>
        ),
        [algorithm.trendingData.toots]
    );

    const mostParticipatedHashtagsSection = useMemo(
        () => {
            const numTags = algorithm.userData.popularUserTags().length;
            const showAllText = `show all ${numTags} hashtags`;

            if (numTags <= DEFAULT_MAX_HASHTAGS_TO_SHOW) {
                logger.debug(`No footer needed, only ${numTags} participated hashtags`);
                return null;
            }

            const toggleAllPopularHashtags = () => {
                if (maxHashtagsToShow === DEFAULT_MAX_HASHTAGS_TO_SHOW) {
                    setMaxHashtagsToShow(algorithm.userData.popularUserTags().length);
                } else {
                    setMaxHashtagsToShow(DEFAULT_MAX_HASHTAGS_TO_SHOW);
                }
            }

            const participatedHashtagsFooter = (
                <div style={{display: "flex", justifyContent: 'space-around', width: "100%"}}>
                    <div style={{width: "40%"}}>
                        {'('}<a onClick={toggleAllPopularHashtags} style={footerLink}>
                            {maxHashtagsToShow === DEFAULT_MAX_HASHTAGS_TO_SHOW ? showAllText : 'show less'}
                        </a>{')'}
                    </div>
                </div>
            );

            return (
                <TrendingSection
                    title="Your Most Participated Hashtags"
                    footer={participatedHashtagsFooter}
                    infoTxt={(tag: TagWithUsageCounts) => `${tag.numToots?.toLocaleString()} of your recent toots`}
                    key={"participatedHashtags"}
                    linkLabel={tagNameMapper}
                    linkUrl={linkMapper}
                    multicolumn={true}
                    onClick={openTrendingLink}
                    trendingObjs={algorithm.userData.popularUserTags().slice(0, maxHashtagsToShow)}
                />
            );
        },
        [algorithm.userData.participatedHashtags, maxHashtagsToShow]
    );

    const scrapedServersSection = useMemo(
        () => (
            <TrendingSection
                title="Servers That Were Scraped"
                infoTxt={(domain: string) => {
                    const serverInfo = algorithm.mastodonServers[domain];
                    const info = [`MAU: ${serverInfo.MAU.toLocaleString()}`];
                    info.push(`followed pct of MAU: ${serverInfo.followedPctOfMAU.toFixed(3)}%`);
                    return info.join(', ');
                }}
                key={"servers"}
                linkLabel={(domain: string) => domain as string}
                linkUrl={(domain: string) => `https://${domain}`}
                onClick={(domain: string, e) => followUri(`https://${domain}`, e)}
                trendingObjs={Object.keys(algorithm.mastodonServers)}
            />
        ),
        [algorithm.mastodonServers]
    );


    return (
        <TopLevelAccordion bodyStyle={noPadding} title="What's Trending">
            <div style={accordionSubheader}>
                <p style={{}}>
                    Trending data was scraped from {Object.keys(algorithm.mastodonServers).length} Mastodon servers.
                </p>
            </div>

            <Accordion>
                {trendingTagsSection}
                {trendingLinksSection}
                {trendingTootSection}
                {scrapedServersSection}
                {mostParticipatedHashtagsSection}
            </Accordion>
        </TopLevelAccordion>
    );
};


// Helper methods
const linkMapper = (obj: TrendingWithHistory) => `${obj.url}`;
const tagNameMapper = (tag: TagWithUsageCounts) => `#${tag.name}`;

const trendingObjInfoTxt = (obj: TrendingWithHistory) => {
    return `${obj.numToots?.toLocaleString()} toots by ${obj.numAccounts?.toLocaleString()} accounts`;
};

const prefixedHtml = (text: string, prefix?: string): React.ReactElement => {
    return (<>
        {prefix?.length ? <span style={monospace}>{`[${prefix}]`}</span> : ''}
        <span style={bold}>{prefix?.length ? ' ' : ''}{text}</span>
    </>);
};


const bold: CSSProperties = {
    fontWeight: "bold",
};

const footerLink: CSSProperties = {
    ...linkesque,
    color: "blue",
    fontSize: "16px",
    fontWeight: "bold",
};

const monospace: CSSProperties = {
    fontFamily: "monospace",
    fontSize: LINK_FONT_SIZE - 3,
};

const imageStyle: CSSProperties = {
    backgroundColor: IMAGE_BACKGROUND_COLOR,
    borderRadius: "15px",
    maxHeight: "200px",
    objectFit: "contain",
    objectPosition: "top",
    width: "70%",
};
