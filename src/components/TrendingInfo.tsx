/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties, useMemo, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import {
    type TagWithUsageCounts,
    type TrendingLink,
    type TrendingWithHistory,
    TagTootsCacheKey,
    Toot,
    TrendingType,
    extractDomain
} from "fedialgo";

import StatusComponent from "./status/Status";
import TopLevelAccordion from "./helpers/TopLevelAccordion";
import TrendingSection, { type LinkRenderer } from "./TrendingSection";
import { accordionSubheader, noPadding } from "../helpers/style_helpers";
import { config } from "../config";
import { followUri, openTrendingLink } from "../helpers/react_helpers";
import { getLogger } from "../helpers/log_helpers";
import { sanitizeServerUrl } from "../helpers/string_helpers";
import { useAlgorithm } from "../hooks/useAlgorithm";

const logger = getLogger("TrendingInfo");


export default function TrendingInfo() {
    const { algorithm } = useAlgorithm();

    // Memoize because trending panels are apparently our most expensive renders
    const scrapedServersSection = useMemo(
        () => {
            const domains = Object.keys(algorithm.trendingData.servers).sort((a, b) => {
                const aInfo = algorithm.trendingData.servers[a];
                const bInfo = algorithm.trendingData.servers[b];
                return bInfo.followedPctOfMAU - aInfo.followedPctOfMAU;
            });

            return (
                <TrendingSection
                    panelType={TrendingType.SERVERS}
                    linkRenderer={{
                        infoTxt: (domain: string) => {
                            const serverInfo = algorithm.trendingData.servers[domain];

                            return [
                                `MAU: ${serverInfo.MAU.toLocaleString()}`,
                                `followed pct of MAU: ${serverInfo.followedPctOfMAU.toFixed(3)}%`
                            ].join(', ');
                        },
                        linkLabel: (domain: string) => domain,
                        linkUrl: (domain: string) => sanitizeServerUrl(domain),
                        onClick: (domain: string, e) => followUri(sanitizeServerUrl(domain), e)
                    }}
                    trendingObjs={domains}
                />
            );
        },
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
                    linkRenderer={{
                        ...trendingObjLinkRenderer,
                        linkLabel: tagNameMapper,
                    }}
                    panelType={TagTootsCacheKey.TRENDING_TAG_TOOTS}
                    tagList={algorithm.trendingData.tags}
                />

                <TrendingSection
                    linkRenderer={{
                        ...trendingObjLinkRenderer,
                        linkLabel: (link: TrendingLink) => prefixedHtml(link.title, extractDomain(link.url)),
                    }}
                    panelType={TrendingType.LINKS}
                    trendingObjs={algorithm.trendingData.links}
                />

                <TrendingSection
                    objRenderer={(toot: Toot) => (
                        <StatusComponent
                            fontColor="black"
                            hideLinkPreviews={false}
                            key={toot.uri}
                            status={toot}
                        />
                    )}
                    panelType={"toots"}
                    trendingObjs={algorithm.trendingData.toots}
                />

                {scrapedServersSection}

                <TrendingSection
                    linkRenderer={simpleTagRenderer}
                    panelType={TagTootsCacheKey.PARTICIPATED_TAG_TOOTS}
                    tagList={algorithm.userData.participatedTags}
                />

                <TrendingSection
                    linkRenderer={simpleTagRenderer}
                    panelType={TagTootsCacheKey.FAVOURITED_TAG_TOOTS}
                    tagList={algorithm.userData.favouritedTags}
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

const baseLinkRenderer = {
    linkUrl: linkMapper,
    onClick: openTrendingLink
};

const simpleTagRenderer: LinkRenderer = {
    ...baseLinkRenderer,
    infoTxt: (tag: TagWithUsageCounts) => `${tag.numToots?.toLocaleString()} toots`,
    linkLabel: tagNameMapper,
};

const bold: CSSProperties = {
    fontWeight: "bold",
};

const monospace: CSSProperties = {
    fontFamily: "monospace",
    fontSize: config.theme.trendingObjFontSize - 3,
};

const trendingObjLinkRenderer = {
    ...baseLinkRenderer,
    infoTxt: trendingObjInfoTxt,
};
