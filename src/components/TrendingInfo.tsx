/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties, useMemo, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import { ScoreName, type TagWithUsageCounts, type TrendingLink, type TrendingWithHistory, TrendingType, extractDomain } from "fedialgo";

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

    const scrapedServersSection = useMemo(
        () => (
            <TrendingSection
                panelType={TrendingType.SERVERS}
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
                    panelType={TrendingType.TAGS}
                    infoTxt={trendingObjInfoTxt}
                    linkLabel={tagNameMapper}
                    linkUrl={linkMapper}
                    onClick={openTrendingLink}
                    trendingObjs={algorithm.trendingData.tags}
                />

                <TrendingSection
                    panelType={TrendingType.LINKS}
                    infoTxt={trendingObjInfoTxt}
                    linkLabel={(link: TrendingLink) => prefixedHtml(link.title, extractDomain(link.url))}
                    linkUrl={linkMapper}
                    onClick={openTrendingLink}
                    trendingObjs={algorithm.trendingData.links}
                />

                <TrendingSection
                    panelType={"toots"}
                    trendingObjs={algorithm.trendingData.toots}
                    // these are all junk that is unused but required args (for now)
                    infoTxt={trendingObjInfoTxt}
                    linkLabel={(link: TrendingLink) => prefixedHtml(link.title, extractDomain(link.url))}
                    linkUrl={linkMapper}
                    onClick={() => logger.warn("Clicked on a trending toot, shouldn't be possible!")}
                />

                {scrapedServersSection}

                <TrendingSection
                    panelType={ScoreName.PARTICIPATED_TAGS}
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

const monospace: CSSProperties = {
    fontFamily: "monospace",
    fontSize: config.theme.trendingObjFontSize - 3,
};
