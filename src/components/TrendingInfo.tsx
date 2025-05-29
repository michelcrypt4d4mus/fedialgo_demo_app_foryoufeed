/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties, useMemo, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import { type TagWithUsageCounts, type TrendingLink, type TrendingWithHistory, extractDomain } from "fedialgo";

import StatusComponent from "./status/Status";
import SubAccordion from "./helpers/SubAccordion";
import TopLevelAccordion from "./helpers/TopLevelAccordion";
import TrendingSection from "./TrendingSection";
import { accordionSubheader, linkesque, noPadding } from "../helpers/style_helpers";
import { ComponentLogger } from "../helpers/log_helpers";
import { config } from "../config";
import { followUri, openTrendingLink } from "../helpers/react_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";

const logger = new ComponentLogger("TrendingInfo");


export default function TrendingInfo() {
    const { algorithm } = useAlgorithm();

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

    const scrapedServersSection = useMemo(
        () => (
            <TrendingSection
                title="Servers That Were Scraped"
                infoTxt={(domain: string) => {
                    const serverInfo = algorithm.trendingData.servers[domain];
                    const info = [`MAU: ${serverInfo.MAU.toLocaleString()}`];
                    info.push(`followed pct of MAU: ${serverInfo.followedPctOfMAU.toFixed(3)}%`);
                    return info.join(', ');
                }}
                key={"servers"}
                linkLabel={(domain: string) => domain as string}
                linkUrl={(domain: string) => `https://${domain}`}
                onClick={(domain: string, e) => followUri(`https://${domain}`, e)}
                trendingObjs={Object.keys(algorithm.trendingData.servers)}
            />
        ),
        [algorithm.trendingData.servers]
    );


    return (
        <TopLevelAccordion bodyStyle={noPadding} title="What's Trending">
            <div style={accordionSubheader}>
                <p style={{}}>
                    Trending data was scraped from {Object.keys(algorithm.trendingData.servers).length}
                    {' '}Mastodon servers.
                </p>
            </div>

            <Accordion>
                <TrendingSection
                    title="Hashtags"
                    infoTxt={trendingObjInfoTxt}
                    linkLabel={tagNameMapper}
                    linkUrl={linkMapper}
                    onClick={openTrendingLink}
                    trendingObjs={algorithm.trendingData.tags}
                />

                <TrendingSection
                    title="Links"
                    hasCustomStyle={true}
                    infoTxt={trendingObjInfoTxt}
                    linkLabel={(link: TrendingLink) => prefixedHtml(link.title, extractDomain(link.url))}
                    linkUrl={linkMapper}
                    onClick={openTrendingLink}
                    trendingObjs={algorithm.trendingData.links}
                />

                {trendingTootSection}
                {scrapedServersSection}

                <TrendingSection
                    title="Your Most Participated Hashtags"
                    infoTxt={(tag: TagWithUsageCounts) => `${tag.numToots?.toLocaleString()} of your recent toots`}
                    linkLabel={tagNameMapper}
                    linkUrl={linkMapper}
                    onClick={openTrendingLink}
                    trendingObjs={algorithm.userData.popularUserTags()}
                />
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
    fontSize: config.theme.trendingObjFontSize - 3,
};
