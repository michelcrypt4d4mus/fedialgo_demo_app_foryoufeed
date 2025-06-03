/*
 * Configuration variables for the application.
 */
import { SpinnerProps } from 'react-bootstrap/esm/Spinner';

import tinycolor from "tinycolor2";
import { capitalCase } from "change-case";
import { LANGUAGE_CODES, BooleanFilterName, ScoreName, TrendingType, TypeFilterName, TagTootsCacheKey, type FilterOptionDataSource } from "fedialgo";

import { MB } from "./helpers/number_helpers";
import { THEME, SwitchType, ThemeConfig, type GradientEndpoints } from "./helpers/style_helpers";
import { type TrendingPanelName } from "./components/TrendingSection";
import { CSSProperties } from 'react';

export const INTERACTIONS = "Interactions";  // Numeric filter label
export type FilterTitle = BooleanFilterName | typeof INTERACTIONS;

export interface CheckboxGradientCfg {
    // Sometimes we want to adjust the gradient instead of using the one between the endpoints to make any of the
    // colors visible (e.g. when the user has one tag they participate in A LOT the rest will be undifferentiated)
    adjustment?: {
        adjustPctiles: number[];
        minTagsToAdjust: number;
    };
    endpoints: GradientEndpoints;
    textSuffix: (n: number) => string;
};

// Two types unioned to create on XOR argument situation
type CheckboxColor = { color: CSSProperties["color"], gradient?: never; };
type CheckboxGradientColor = { color?: never; gradient: CheckboxGradientCfg };

export type CheckboxTooltipConfig = {
    anchor?: string;
    highlight?: CheckboxColor | CheckboxGradientColor;  // Union type forces exactly one of 'color' or 'gradient' props
    text: string;
};

// Same as CheckboxGradientCfg but with the actual array or colors set
export interface CheckboxGradientTooltipConfig extends CheckboxTooltipConfig {
    colors: tinycolor.Instance[];  // Array of colors for the gradient
};

// TODO: this is kind of a monstrosity
export type FilterOptionTypeTooltips = {
    [key in (BooleanFilterName.LANGUAGE | TypeFilterName | FilterOptionDataSource)]?: CheckboxTooltipConfig
};

type FilterOptionFormatCfg = {
    formatLabel?: (name: string) => string;  // Fxn to transform the option name to a displayed label
    position: number;                        // Position of this filter in the filters section, used for ordering
    tooltips?: FilterOptionTypeTooltips;     // Color highlight config for filter options
};

// Subconfig types
type AppConfig = {
    accessTokenRevokedMsg: string;
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
    boolean: {
        maxLabelLength: number;
        minTootsSlider: {
            idealNumOptions: number,
            minItems: number;
            tooltipHoverDelay: number;
        },
        optionsFormatting: Record<BooleanFilterName, FilterOptionFormatCfg>,
    };
    headerSwitches: {
        tooltipHoverDelay: number;
        tooltipText: Record<SwitchType, string>;
    };
    numeric: {
        description: string;
        invertSelectionTooltipTxt: string;
        maxValue: number;
        position: number;
        title: FilterTitle;
    };
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

type TimelineConfig = {
    autoloadOnFocusAfterMinutes: number;
    defaultLoadingMsg: string;
    defaultNumDisplayedToots: number;
    loadingErroMsg: string;
    noTootsMsg: string;
    numTootsToLoadOnScroll: number;
    checkboxTooltipText: {
        autoupdate: string;
    };
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
    panels: Record<TrendingPanelName, TrendingPanelCfg>;
};

type WeightsConfig = {
    defaultStepSize: number;
    presetMenuLabel: string;
    scalingMultiplier: number;
};


// Constants for subconfig
const HOMEPAGE = process.env.FEDIALGO_HOMEPAGE || "github.com/michelcrypt4d4mus/fedialgo_demo_app_foryoufeed";

interface ConfigType {
    filters: FilterConfig;
    locale: LocaleConfig;
    replies: ReplyConfig;
    stats: StatsConfig;
    theme: ThemeConfig;
    timeline: TimelineConfig;
    toots: TootConfig;
    trending: TrendingConfig;
    weights: WeightsConfig;
};


// App level config that is not user configurable
class Config implements ConfigType {
    app: AppConfig = {
        accessTokenRevokedMsg: `Your access token was revoked. Please log in again to continue using the app.`,
        changelogUrl: `https://github.com/michelcrypt4d4mus/fedialgo_demo_app_foryoufeed/releases`,
        developerMastodonUrl: "https://universeodon.com/@cryptadamist",
        headerIconUrl: "https://media.universeodon.com/accounts/avatars/109/363/179/904/598/380/original/eecdc2393e75e8bf.jpg",
        homepage: HOMEPAGE,
        loadingSpinnerType: 'grow',         // Type of loading spinner to use
        repoName: HOMEPAGE ? HOMEPAGE.split('/').pop() : null,
        repoUrl: HOMEPAGE ? HOMEPAGE.replace(/(\w+)\.github\.io/, `github.com/$1`) : HOMEPAGE,
        showcaseImageUrl: "https://raw.githubusercontent.com/michelcrypt4d4mus/fedialgo_demo_app_foryoufeed/refs/heads/master/public/assets/Showcase.png",
    }

    filters: FilterConfig = {
        boolean: {
            maxLabelLength: 19,                          // Maximum length of a filter option label
            minTootsSlider: {
                idealNumOptions: 60,                     // Ideal number of options to show in the minTootsSlider
                minItems: 10,                            // Minimum number of items to show (used for max value calculation)
                tooltipHoverDelay: 50,                   // Delay for the minimum toots slider tooltip in milliseconds
            },
            optionsFormatting: {                         // How filter options should be displayed w/what header switches
                [BooleanFilterName.HASHTAG]: {
                    position: 2,
                    tooltips: {
                        [TagTootsCacheKey.FAVOURITED_TAG_TOOTS]: {
                            highlight: {
                                gradient: {
                                    endpoints: THEME.favouritedTagGradient,
                                    textSuffix: (n: number) => ` ${n} times recently`,
                                },
                            },
                            text: `You've favourited this hashtag`
                        },
                        [TagTootsCacheKey.PARTICIPATED_TAG_TOOTS]: {
                            highlight: {
                                gradient: {
                                    adjustment: {
                                        adjustPctiles: [0.95, 0.98], // Percentiles for gradient adjustment of participated tags
                                        minTagsToAdjust: 40,         // Minimum number of participated tags to adjust the gradient
                                    },
                                    endpoints: [                     // Start and end points for the color gradient
                                        tinycolor(THEME.participatedTagColorMin),
                                        tinycolor(THEME.participatedTagColor),
                                    ],
                                    textSuffix: (n: number) => ` ${n} times recently`,
                                },
                            },
                            text: `You've posted this hashtag`,  // the string "N times" is appended in getTooltipInfo()
                        },
                        [TagTootsCacheKey.TRENDING_TAG_TOOTS]: {
                            highlight: {
                                gradient: {
                                    endpoints: [
                                        tinycolor(THEME.trendingTagColorFaded),
                                        tinycolor(THEME.trendingTagColor),
                                    ],
                                    textSuffix: (n: number) => ` (${n} recent toots)`,
                                },
                            },
                            text: `This hashtag is trending`,
                        },
                        [TypeFilterName.FOLLOWED_HASHTAGS]: {
                            highlight: {
                                color: THEME.followedTagColor
                            },
                            text: `You follow this hashtag`,
                        },
                    },
                },
                [BooleanFilterName.LANGUAGE]: {
                    position: 5,
                    tooltips: {
                        [BooleanFilterName.LANGUAGE]: {
                            highlight: {
                                color: THEME.followedUserColor
                            },
                            text: `You post most in this language`,
                        },
                    },
                    formatLabel: (code: string) => LANGUAGE_CODES[code] ? capitalCase(LANGUAGE_CODES[code]) : code,
                },
                [BooleanFilterName.TYPE]: {
                    position: 1,
                    formatLabel: (name: string) => capitalCase(name),
                },
                [BooleanFilterName.USER]: {
                    position: 4,
                    tooltips: {
                        [ScoreName.FAVOURITED_ACCOUNTS]: {
                            highlight: {
                                gradient: {
                                    adjustment: {
                                        adjustPctiles: [0.80, 0.98], // Percentiles for gradient adjustment of participated tags
                                        minTagsToAdjust: 40,         // Minimum number of participated tags to adjust the gradient
                                    },
                                    endpoints: [tinycolor("#BCD8D8"), tinycolor(THEME.followedUserColor)],
                                    textSuffix: (n: number) => n ? ` (and favourited or retooted them ${n} times recently)` : '',
                                },
                            },
                            text: `You follow this account`,
                        },
                    },
                },
                [BooleanFilterName.APP]: {
                    position: 99,
                },  // Currently disabled by fedialgo config isAppFilterVisible because it's not very useful
            },
        },
        numeric: {
            description: "Filter based on minimum/maximum number of replies, retoots, etc",
            invertSelectionTooltipTxt: "Show toots with less than the selected number of interactions instead of more",
            position: 3,
            maxValue: 50,                          // Maximum value for numeric filters
            title: INTERACTIONS,                   // Title for numeric filters section
        },
        headerSwitches: {
            tooltipText: {
                [SwitchType.HIGHLIGHTS]: "Show the colored highlights in this panel",
                [SwitchType.HIGHLIGHTS_ONLY]: "Only show the color highlighted options in this panel",
                [SwitchType.INVERT_SELECTION]: "Exclude toots matching your selected options instead of including them",
                [SwitchType.SORT_BY_COUNT]: "Sort the options in this panel by number of toots instead of alphabetically",
            },
            tooltipHoverDelay: 500,               // Delay for header tooltips in milliseconds
        }
    }

    locale: LocaleConfig = {
        defaultLocale: 'en-CA',                    // Default locale for the application
    }

    replies: ReplyConfig = {
        defaultAcceptedAttachments: {              // Default in case the user's server doesn't provide this info
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

    theme: ThemeConfig = THEME;

    timeline: TimelineConfig = {
        autoloadOnFocusAfterMinutes: 5,       // Autoload new toots if timeline is this old (and feature is enabled)
        checkboxTooltipText: {
            autoupdate: "If this box is checked the feed will be automatically updated when you focus this browser tab.",
        },
        defaultLoadingMsg: "Loading (first time can take up to a minute or so)",   // Message when first loading toots
        defaultNumDisplayedToots: 20,         // Default number of toots displayed in the timeline
        loadingErroMsg: `Currently loading, please wait a moment and try again.`,  // Error message when busy
        noTootsMsg: "No toots in feed! Maybe check your filters settings?", // Message when no toots are available
        numTootsToLoadOnScroll: 10,           // Number of toots to load on scroll
    }

    toots: TootConfig = {
        imageHeight: 314,                     // Default height for images in toots
        maxPreviewCardLength: 350,            // Maximum length of preview card description
        scoreDigits: 3,                       // Number of digits to display in the score
    }

    trending: TrendingConfig = {
        maxLengthForMulticolumn: 55,          // Maximum length of a trending object label to use multicolumn layout
        panels:  {
            [TagTootsCacheKey.FAVOURITED_TAG_TOOTS]: {
                initialNumShown: 40,
                objTypeLabel: "of your favourite hashtags",
                title: "Hashtags You Often Favourite",
            },
            [TrendingType.LINKS]: {
                hasCustomStyle: true,        // TODO: this sucks
                initialNumShown: 30,
                objTypeLabel: `trending ${TrendingType.LINKS}`,
            },
            [TagTootsCacheKey.PARTICIPATED_TAG_TOOTS]: {
                initialNumShown: 40,
                objTypeLabel: "of your hashtags",
                title: "Hashtags You Often Post About",
            },
            [TrendingType.SERVERS]: {
                description: "The Mastodon servers all these trending links, toots, and hashtags came from, sorted by the percentage of that server's monthly active users you follow:",
                initialNumShown: 40,        // TODO: unused
                title: "Servers Telling Us What's Trending In The Fediverse",
            },
            [TagTootsCacheKey.TRENDING_TAG_TOOTS]: {
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
        presetMenuLabel: "Preset Algorithm Configurations", // Label for the preset menu in the weights panel
        scalingMultiplier: 1.2,               // Multiplier for scaling weight sliders responsively
    }
};


const config = new Config();
export { config };
