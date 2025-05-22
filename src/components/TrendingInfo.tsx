/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import { type TagWithUsageCounts, type TrendingLink, type TrendingWithHistory, extractDomain } from "fedialgo";

import StatusComponent from "./status/Status";
import SubAccordion from "./helpers/SubAccordion";
import TopLevelAccordion from "./helpers/TopLevelAccordion";
import TrendingSection, { LINK_FONT_SIZE } from "./TrendingSection";
import { followUri, openTrendingLink } from "../helpers/react_helpers";
import { IMAGE_BACKGROUND_COLOR, accordionSubheader, linkesque, noPadding } from "../helpers/style_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";

const DEFAULT_MAX_HASHTAGS_TO_SHOW = 100;


export default function TrendingInfo() {
    const { algorithm } = useAlgorithm();
    const [maxHashtagsToShow, setMaxHashtagsToShow] = useState(DEFAULT_MAX_HASHTAGS_TO_SHOW);

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

    const buildParticipatedHashtagsFooter = () => {
        const numTags = algorithm.userData.popularUserTags().length;
        const showAllText = `show all ${numTags} hashtags`;

        if (numTags <= DEFAULT_MAX_HASHTAGS_TO_SHOW) {
            console.log(`No footer needed, only ${numTags} participated hashtags`);
            return null;
        }

        const toggleAllPopularHashtags = () => {
            if (maxHashtagsToShow === DEFAULT_MAX_HASHTAGS_TO_SHOW) {
                setMaxHashtagsToShow(algorithm.userData.popularUserTags().length);
            } else {
                setMaxHashtagsToShow(DEFAULT_MAX_HASHTAGS_TO_SHOW);
            }
        }

        return (
            <div style={{display: "flex", justifyContent: 'space-around', width: "100%"}}>
                <div style={{width: "40%"}}>
                    {'('}<a onClick={toggleAllPopularHashtags} style={footerLink}>
                        {maxHashtagsToShow === DEFAULT_MAX_HASHTAGS_TO_SHOW ? showAllText : 'show less'}
                    </a>{')'}
                </div>
            </div>
        );
    };

    return (
        <TopLevelAccordion bodyStyle={noPadding} title="What's Trending">
            <div style={accordionSubheader}>
                <p style={{}}>
                    Trending data was scraped from {Object.keys(algorithm.mastodonServers).length} Mastodon servers.
                </p>
            </div>

            <Accordion>
                <TrendingSection
                    title="Hashtags"
                    infoTxt={trendingObjInfoTxt}
                    key={"hashtags"}
                    linkLabel={tagNameMapper}
                    linkUrl={linkMapper}
                    onClick={openTrendingLink}
                    trendingObjs={algorithm.trendingData.tags}
                />

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

                <TrendingSection
                    title="Your Most Participated Hashtags"
                    footer={buildParticipatedHashtagsFooter()}
                    infoTxt={(tag: TagWithUsageCounts) => `${tag.numToots?.toLocaleString()} of your recent toots`}
                    key={"participatedHashtags"}
                    linkLabel={tagNameMapper}
                    linkUrl={linkMapper}
                    onClick={openTrendingLink}
                    trendingObjs={algorithm.userData.popularUserTags().slice(0, maxHashtagsToShow)}
                />

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
            </Accordion>
        </TopLevelAccordion>
    );
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
