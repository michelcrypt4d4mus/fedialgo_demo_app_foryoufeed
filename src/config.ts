/*
 * Configuration variables for the application.
 */
import { CSSProperties } from "react";
import { SpinnerProps } from 'react-bootstrap/esm/Spinner';

import { capitalCase } from "change-case";

import { LANGUAGE_CODES, BooleanFilterName, ScoreName, TrendingData, TrendingType } from "fedialgo";

export type TrendingPanel = ScoreName.PARTICIPATED_TAGS | keyof TrendingData;

export enum SwitchType {
    HIGHLIGHTS_ONLY = "highlightsOnly",
    INVERT_SELECTION = "invertSelection",
    SORT_BY_COUNT = "sortByCount",
};

const HOMEPAGE = process.env.FEDIALGO_HOMEPAGE || "github.com/michelcrypt4d4mus/fedialgo_demo_app_foryoufeed";
const KB = 1024;
const MB = KB * KB;

type AppConfig = {
    changelogUrl: string;
    developerMastodonUrl: string;
    headerIconUrl: string;
    homepage: string;
    loadingSpinnerType: SpinnerProps['animation'];
    repoName: string | null;
    repoUrl: string;
    showcaseImageUrl: string;
};

type FilterConfig = {
    defaultMinTootsToAppear: number;
    maxOptionLength: number;
    minOptionsToShowSlider: number;
    optionsList: {[key in BooleanFilterName]?: FilterGridConfig};
};

export type FilterGridConfig = {
    labelMapper?: (name: string) => string;  // Fxn to transform the option name to a displayed label
    [SwitchType.HIGHLIGHTS_ONLY]?: boolean; // Whether to only show highlighted options
};

type LocaleConfig = {
    defaultLocale: string;
};

type ReplyConfig = {
    defaultAcceptedAttachments: Record<string, string[]>;
    defaultMaxCharacters: number;
    defaultMaxAttachments: number;
    defaultMaxImageSize: number;
    defaultMaxVideoSize: number;
};

type StatsConfig = {
    animationDuration: number;
};

type ThemeConfig = {
    accordionOpenBlue: CSSProperties['color'];
    feedBackgroundColor: CSSProperties['backgroundColor'];
    feedBackgroundColorLite: CSSProperties['backgroundColor'];
    followedTagColor: CSSProperties['color'];
    followedUserColor: CSSProperties['color'];
    followedUserColorFaded: CSSProperties['color'];
    participatedTagColor: CSSProperties['color'];
    participatedTagColorMin: CSSProperties['color'];
    trendingObjFontSize: number;
    trendingTagColor: CSSProperties['color'];
    trendingTagColorFaded: CSSProperties['color'];
};

type TimelineConfig = {
    autoloadOnFocusAfterMinutes: number;
    defaultLoadingMsg: string;
    loadingErroMsg: string;
    noTootsMsg: string;
    numTootsToLoadOnScroll: number;
    defaultNumDisplayedToots: number;
};

type TooltipConfig = {
    filterOptionDelay: number;
    filterSwitchTooltips: Record<SwitchType, string>;
    gradientAdjustPctiles?: number[];
    headerDelay: number;
    minTagsForGradientAdjust?: number;
    minTootsSliderDelay: number;
};

type TootConfig = {
    imageHeight: number;
    maxPreviewCardLength: number;
    scoreDigits: number;
};

type TrendingPanelCfg = {
    description?: string;
    hasCustomStyle?: boolean;
    initialNumShown: number;
    objTypeLabel?: string;
    prependTrending?: boolean;
    title?: string;
};

type TrendingConfig = {
    maxLengthForMulticolumn: number;
    panels: Record<TrendingPanel, TrendingPanelCfg>;
};

type WeightsConfig = {
    defaultStepSize: number;
    scalingMultiplier: number;
};

interface ConfigType {
    filters: FilterConfig;
    replies: ReplyConfig;
    stats: StatsConfig;
    theme: ThemeConfig;
    timeline: TimelineConfig;
    tooltips: TooltipConfig;
    toots: TootConfig;
    trending: TrendingConfig;
    weights: WeightsConfig;
};


// App level config that is not user configurable
class Config implements ConfigType {
    app: AppConfig = {
        changelogUrl: `https://github.com/michelcrypt4d4mus/fedialgo/blob/master/CHANGELOG.md`,
        developerMastodonUrl: "https://universeodon.com/@cryptadamist",
        headerIconUrl: "https://media.universeodon.com/accounts/avatars/109/363/179/904/598/380/original/eecdc2393e75e8bf.jpg",
        homepage: HOMEPAGE,
        loadingSpinnerType: 'grow',         // Type of loading spinner to use
        repoName: HOMEPAGE ? HOMEPAGE.split('/').pop() : null,
        repoUrl: HOMEPAGE ? HOMEPAGE.replace(/(\w+)\.github\.io/, `github.com/$1`) : HOMEPAGE,
        showcaseImageUrl: "https://raw.githubusercontent.com/michelcrypt4d4mus/fedialgo_demo_app_foryoufeed/refs/heads/master/public/assets/Showcase.png",
    }

    filters: FilterConfig = {
        defaultMinTootsToAppear: 5,          // Minimum number of toots for an option to appear in the filter
        maxOptionLength: 21,                 // Maximum length of a filter option label
        minOptionsToShowSlider: 30,          // Minimum number of options to show the slider & hide low count options
        optionsList: {                       // Configure how the filter options list should be displayed
            [BooleanFilterName.HASHTAG]: {
                [SwitchType.HIGHLIGHTS_ONLY]: true,
            },
            [BooleanFilterName.LANGUAGE]: {
                labelMapper: (code: string) => LANGUAGE_CODES[code] ? capitalCase(LANGUAGE_CODES[code]) : code,
            },
            [BooleanFilterName.TYPE]: {
                labelMapper: (name: string) => capitalCase(name),
            },
            [BooleanFilterName.USER]: {
                [SwitchType.HIGHLIGHTS_ONLY]: true,
            }
        },
    }

    locale: LocaleConfig = {
        defaultLocale: 'en-CA',              // Default locale for the application
    }

    replies: ReplyConfig = {
        defaultAcceptedAttachments: {        // Default in case the user's server doesn't provide this info
            'audio/*': ['.mp3', '.wav'],
            'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
            'video/*': ['.mp4', '.webm'],
        },
        defaultMaxCharacters: 500,           // Default maximum characters for a reply
        defaultMaxAttachments: 4,            // Default maximum attachments for a reply
        defaultMaxImageSize: 10 * MB,        // Default maximum image size for a reply
        defaultMaxVideoSize: 40 * MB,        // Default maximum video size for a reply
    }

    stats: StatsConfig = {
        animationDuration: 500,               // Duration of stats animations in milliseconds
    }

    theme: ThemeConfig = {
        accordionOpenBlue: "#7ac5cc",       // Open accordion header color. NOTE THIS WILL NOT CHANGE THE CSS, it's at .accordion-button:not(.collapsed){
        feedBackgroundColor: '#15202b',     // background color for the timeline
        feedBackgroundColorLite: '#bcddfd', // lighter background color for the application
        followedTagColor: 'yellow',           // Color for followed tags
        followedUserColor: 'cyan',            // Color for followed users
        followedUserColorFaded: '#2092a1',  // Faded color for followed users
        participatedTagColor: '#92a14a',    // Color for participated tags
        participatedTagColorMin: '#d8deb9', // Minimum color for participated tags
        trendingObjFontSize: 16,              // Font size for trending objects
        trendingTagColor: 'firebrick',        // Color for trending tags
        trendingTagColorFaded: '#f08c8c',   // Faded color for trending tags
    }

    timeline: TimelineConfig = {
        autoloadOnFocusAfterMinutes: 5,       // Autoload new toots if timeline is this old (and feature is enabled)
        defaultLoadingMsg: "Loading (first time can take up to a minute or so)", // Message when first loading toots
        loadingErroMsg: `Currently loading, please wait a moment and try again.`, // Error message when busy
        noTootsMsg: "No toots in feed! Maybe check your filters settings?", // Message when no toots are available
        numTootsToLoadOnScroll: 10,           // Number of toots to load on scroll
        defaultNumDisplayedToots: 20,         // Default number of toots displayed in the timeline
    }

    tooltips: TooltipConfig = {
        filterOptionDelay: 500,               // Delay for filter option tooltips in milliseconds
        filterSwitchTooltips: {
            [SwitchType.HIGHLIGHTS_ONLY]: "Only show the color highlighted options in this panel",
            [SwitchType.INVERT_SELECTION]: "Exclude toots matching your selected options instead of including them",
            [SwitchType.SORT_BY_COUNT]: "Sort the options in this panel by number of toots instead of alphabetically",
        },
        gradientAdjustPctiles: [0.95, 0.98],  // Percentiles for gradient adjustment of participated tags
        headerDelay: 500,                     // Delay for header tooltips in milliseconds
        minTagsForGradientAdjust: 40,         // Minimum number of participated tags for gradient adjustment
        minTootsSliderDelay: 50,              // Delay for the minimum toots slider tooltip in milliseconds
    }

    toots: TootConfig = {
        imageHeight: 314,                     // Default height for images in toots
        maxPreviewCardLength: 350,            // Maximum length of preview card description
        scoreDigits: 3,                       // Number of digits to display in the score
    }

    trending: TrendingConfig = {
        maxLengthForMulticolumn: 50,          // Maximum length of a trending object label to use multicolumn layout
        panels:  {
            [TrendingType.LINKS]: {
                hasCustomStyle: true,        // TODO: this sucks
                initialNumShown: 30,
                objTypeLabel: `trending ${TrendingType.LINKS}`
            },
            [ScoreName.PARTICIPATED_TAGS]: {
                initialNumShown: 40,
                objTypeLabel: "of your hashtags",
                title: "Hashtags You Often Post About",
            },
            [TrendingType.SERVERS]: {
                description: "The Mastodon servers all these trending links, toots, and hashtags came from, sorted by the percentage of that server's monthly active users you follow:",
                initialNumShown: 40,        // TODO: unused
                title: "Servers Telling Us What's Trending In The Fediverse",
            },
            [TrendingType.TAGS]: {
                initialNumShown: 30,
                objTypeLabel: "trending hashtags",
            },
            toots: {
                initialNumShown: 10,
                objTypeLabel: "trending toots",
            },
        },
    }

    weights: WeightsConfig = {
        defaultStepSize: 0.02,                // Default step size for weight sliders
        scalingMultiplier: 1.2,               // Multiplier for scaling weight sliders responsively
    }
};


const config = new Config();
export { config };
