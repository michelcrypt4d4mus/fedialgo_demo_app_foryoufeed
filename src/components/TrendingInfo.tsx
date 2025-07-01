/*
 * WIP: Component for displaying the trending hashtags in the Fediverse.
 */
import React, { CSSProperties, useEffect, useMemo, useState } from "react";

import Accordion from 'react-bootstrap/esm/Accordion';
import {
    Toot,
    TrendingType,
    extractDomain,
    sleep,
    type TagWithUsageCounts,
    type TrendingLink,
    type TrendingWithHistory,
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

const SLEEP_SECONDS = 5;

const logger = getLogger("TrendingInfo");


export default function TrendingInfo() {
    const { algorithm, isLoading } = useAlgorithm();
    const [trendingData, setTrendingData] = useState(algorithm.trendingData);

    useEffect(() => {
        const numTrendingLinks = trendingData?.links?.length || 0;
        const bustLogger = logger.tempLogger('bustCacheIfNoTrendingData()');

        if (isLoading) {
            bustLogger.trace(`Trending data is loading, not busting cache yet. Num trending links: ${numTrendingLinks}`);
            return;
        }

        const bustCacheIfNoTrendingData = async () => {
            bustLogger.trace(`bustCacheIfNoTrendingData() invoked, about to sleep for ${SLEEP_SECONDS} seconds...`);
            await sleep(SLEEP_SECONDS * 1000); // Wait for SLEEP_SECONDS to see if trending data is loaded
            bustLogger.trace(`Trending data not loaded after ${SLEEP_SECONDS} seconds, calling refreshTrendingData()`);
            setTrendingData(await algorithm.refreshTrendingData());
        }

        bustCacheIfNoTrendingData();
    }, [isLoading]);

    // Memoize because trending panels are apparently our most expensive renders
    const scrapedServersSection = useMemo(() => {
        const domains = Object.keys(trendingData.servers).sort((a, b) => {
            const aInfo = trendingData.servers[a];
            const bInfo = trendingData.servers[b];
            return bInfo.followedPctOfMAU - aInfo.followedPctOfMAU;
        });

        return (
            <TrendingSection
                panelType={TrendingType.SERVERS}
                linkRenderer={{
                    infoTxt: (domain: string) => {
                        const serverInfo = trendingData.servers[domain];

                        return [
                            `MAU: ${serverInfo.MAU.toLocaleString()}`,
                            `followed pct of MAU: ${serverInfo.followedPctOfMAU.toFixed(3)}%`
                        ].join(', ');
                    },
                    linkLabel: (domain: string) => domain,
                    linkUrl: (domain: string) => sanitizeServerUrl(domain, true),
                    onClick: (domain: string, e) => followUri(sanitizeServerUrl(domain, true), e)
                }}
                trendingObjs={domains}
            />
        );
    }, [isLoading, trendingData, trendingData.servers]);

    // TODO: had to memoize these because they weren't updating properly at initial load time (???)
    const tagSection = useMemo(() => {
        return (
            <TrendingSection
                linkRenderer={{
                    ...trendingObjLinkRenderer,
                    linkLabel: tagNameMapper,
                }}
                tagList={trendingData.tags}
            />
        );
    }, [isLoading, trendingData, trendingData.tags]);

    const linksSection = useMemo(() => {
        return (
            <TrendingSection
                linkRenderer={{
                    ...trendingObjLinkRenderer,
                    linkLabel: (link: TrendingLink) => prefixedHtml(link.title, extractDomain(link.url)),
                }}
                panelType={TrendingType.LINKS}
                trendingObjs={trendingData.links}
            />
        );
    }, [isLoading, trendingData, trendingData.links]);

    const tootsSection = useMemo(() => {
        return (
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
                trendingObjs={trendingData.toots}
            />
        );
    }, [isLoading, trendingData, trendingData.toots]);

    return (
        <TopLevelAccordion bodyStyle={noPadding} title="What's Trending">
            <div style={accordionSubheader}>
                <p style={{}}>
                    Trending data was scraped from {Object.keys(trendingData.servers).length}
                    {' '}Mastodon servers.
                </p>
            </div>

            <Accordion>
                {tagSection}
                {linksSection}
                {tootsSection}
                {scrapedServersSection}

                <TrendingSection
                    linkRenderer={simpleTagRenderer}
                    tagList={algorithm.userData.participatedTags}
                />

                <TrendingSection
                    linkRenderer={simpleTagRenderer}
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
