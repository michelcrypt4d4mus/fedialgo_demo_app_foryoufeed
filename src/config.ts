/*
 * Configuration variables for the application.
 */
import { SpinnerProps } from 'react-bootstrap/esm/Spinner';

import { mastodon } from 'masto';
import { capitalCase } from "change-case";
import TheAlgorithm, {
    FEDIALGO,
    BooleanFilterName,
    ScoreName,
    TagTootsCategory,
    TrendingType,
    TypeFilterName,
    optionalSuffix,
    type FilterOptionDataSource
} from "fedialgo";

import { MB } from "./helpers/number_helpers";
import { nTimes } from './helpers/string_helpers';
import { THEME, SwitchType, ThemeConfig } from "./helpers/style_helpers";
import { type CheckboxTooltipConfig, type GuiCheckboxLabel, type LinkWithTooltipCfg } from './helpers/tooltip_helpers';
import { type TrendingPanelName } from "./components/TrendingSection";


// Mastodon OAuth scopes required for this app to work. Details: https://docs.joinmastodon.org/api/oauth-scopes/
const OAUTH_SCOPES = [
    "read",
    "write:bookmarks",
    "write:favourites",
    "write:follows",
    "write:media",
    "write:mutes",
    "write:statuses",  // Required for retooting and voting in polls
];

const HOMEPAGE = process.env.FEDIALGO_HOMEPAGE || "https://michelcrypt4d4mus.github.io/fedialgo_demo_app_foryoufeed";


// Subconfig types
type CreateAppParams = Parameters<mastodon.rest.v1.AppRepository["create"]>[0];

type AppConfig = {
    accessTokenRevokedMsg: string;
    changelogUrl: string;
    createAppParams: Readonly<Omit<CreateAppParams, "redirectUris">>;
    defaultServer: string;
    developerMastodonUrl: string;
    headerIconUrl: string;
    loadingSpinnerType: SpinnerProps['animation'];
    repoName: string | null;
    repoUrl: string;
    showcaseImageUrl: string;
};

type FilterTooltipConfigKey = (
      FilterOptionDataSource
    | BooleanFilterName.LANGUAGE
    | TypeFilterName.FOLLOWED_HASHTAGS
);

type FilterOptionFormatCfg = {
    formatLabel?: (name: string) => string;  // Fxn to transform the option name to a displayed label
    hidden?: boolean;                        // If true hide this option from the UI
    position: number;                        // Position of this filter in the filters section, used for ordering
    tooltips?: {                             // Color highlight config for filter options
        readonly [key in FilterTooltipConfigKey]?: Readonly<CheckboxTooltipConfig>
    };
};

type FilterConfig = {
    boolean: {
        readonly maxLabelLength: number;
        readonly minTootsSlider: {
            readonly idealNumOptions: number,
            readonly minItems: number;
            readonly tooltipHoverDelay: number;
        },
        readonly optionsFormatting: Readonly<Record<BooleanFilterName, Readonly<FilterOptionFormatCfg>>>,
    };
    headerSwitches: {
        readonly tooltipHoverDelay: number;
        readonly tooltipText: Readonly<Record<SwitchType, string>>;
    };
    numeric: {
        readonly description: string;
        readonly invertSelectionTooltipTxt: string;
        readonly maxValue: number;
        readonly position: number;
        readonly title: string;
    };
};

type LocaleConfig = {
    defaultLocale: string;
};

type ReplyConfig = {
    defaultAcceptedAttachments: Readonly<Record<string, string[]>>;
    defaultMaxCharacters: number;
    defaultMaxAttachments: number;
    defaultMaxImageSize: number;
    defaultMaxVideoSize: number;
};

type StatsConfig = {
    animationDuration: number;
    numPercentiles: number;
};

type TimelineConfig = {
    autoloadOnFocusAfterMinutes: number;
    defaultLoadingMsg: string;
    defaultNumDisplayedToots: number;
    guiCheckboxLabels: {
        readonly allowMultiSelect: Readonly<GuiCheckboxLabel>;
        readonly autoupdate: Readonly<GuiCheckboxLabel>;
        readonly hideSensitive: Readonly<GuiCheckboxLabel>;
        readonly showFilterHighlights: Readonly<GuiCheckboxLabel>;
        readonly showLinkPreviews: Readonly<GuiCheckboxLabel>;
        readonly stickToTop: Readonly<GuiCheckboxLabel>;
    };
    loadTootsButtons: {
        readonly loadNewToots: Readonly<LinkWithTooltipCfg>;
        readonly loadOldToots: Readonly<LinkWithTooltipCfg>;
        readonly loadUserDataForAlgorithm: Readonly<LinkWithTooltipCfg>;
    },
    loadingErroMsg: string;
    noTootsMsg: string;
    numTootsToLoadOnScroll: number;
    tooltips: {
        readonly accountTooltipDelayMS: number;
        readonly defaultTooltipDelayMS: number;
    }
};

type TootConfig = {
    imageHeight: number;
    maxPreviewCardLength: number;
    scoreDigits: number;
};

type TrendingConfig = {
    maxLengthForMulticolumn: number;
    panels: Readonly<Record<TrendingPanelName, Readonly<TrendingPanelCfg>>>;
};

type TrendingPanelCfg = {
    description?: string;
    hasCustomStyle?: boolean;
    initialNumShown: number;
    objTypeLabel?: string;
    prependTrending?: boolean;
    title?: string;
};

type WeightsConfig = {
    defaultStepSize: number;
    presetMenuLabel: string;
    scalingMultiplier: number;
};

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

interface ReadonlyConfig extends Readonly<ConfigType> {};


// App level config that is not user configurable
class Config implements ReadonlyConfig {
    app: AppConfig = {
        accessTokenRevokedMsg: `Your access token expired. Please log in again to continue using the app.`,
        changelogUrl: `https://github.com/michelcrypt4d4mus/fedialgo_demo_app_foryoufeed/releases`,
        createAppParams: {
            clientName: `${FEDIALGO}Demo`,
            scopes: OAUTH_SCOPES.join(" "),
            website: HOMEPAGE,
        },
        defaultServer: TheAlgorithm.isDebugMode ? "universeodon.com" : "mastodon.social",
        developerMastodonUrl: "https://universeodon.com/@cryptadamist",
        headerIconUrl: "https://media.universeodon.com/accounts/avatars/109/363/179/904/598/380/original/eecdc2393e75e8bf.jpg",
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
                [BooleanFilterName.APP]: {               // App filter is kinda useless (98% of toots don't have the application property)
                    hidden: true,
                    position: 99,
                },
                [BooleanFilterName.HASHTAG]: {
                    position: 2,
                    tooltips: {
                        [TagTootsCategory.FAVOURITED]: {
                            highlight: {
                                gradient: {
                                    endpoints: THEME.favouritedTagGradient,
                                    textWithSuffix: (s: string, n: number) => `${s} ${nTimes(n)} recently`,
                                },
                            },
                            text: `You favourited this hashtag`
                        },
                        [TagTootsCategory.PARTICIPATED]: {
                            highlight: {
                                gradient: {
                                    adjustment: {
                                        adjustPctiles: [0.95, 0.98], // Percentiles for gradient adjustment of participated tags
                                        minTagsToAdjust: 40,         // Minimum number of participated tags to adjust the gradient
                                    },
                                    endpoints: THEME.participatedTagGradient,
                                    textWithSuffix: (s: string, n: number) => `${s} ${nTimes(n)} recently`,
                                },
                            },
                            text: `You tooted this hashtag`,  // the string "N times" is appended in getTooltipInfo()
                        },
                        [TagTootsCategory.TRENDING]: {
                            highlight: {
                                gradient: {
                                    endpoints: THEME.trendingTagGradient,
                                    textWithSuffix: (s: string, n: number) => `${s} (${n} recent toot${n > 1 ? 's' : ''})`,
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
                                gradient: {
                                    endpoints: THEME.followedUserGradient,
                                    textWithSuffix: (s: string, n: number) => {
                                        return s + optionalSuffix(n, `${nTimes(n)} recently`);
                                    },
                                },
                            },
                            text: `You used this language`,
                        },
                    },
                },
                [BooleanFilterName.SERVER]: {
                    position: 6,
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
                                    endpoints: THEME.followedUserGradient,
                                    // TODO: the code currently requires this string start with "and i" which sucks
                                    textWithSuffix: (_s: string, n: number) => n ? `Interacted ${nTimes(n)} recently` : '',
                                },
                            },
                            text: `You follow this account`,
                        },
                    },
                },
            },
        },
        numeric: {
            description: "Filter based on minimum/maximum number of replies, retoots, etc",
            invertSelectionTooltipTxt: "Show toots with less than the selected number of interactions instead of more",
            position: 3,
            maxValue: 50,                          // Maximum value for numeric filters
            title: "Interactions",                 // Title for numeric filters section
        },
        headerSwitches: {
            tooltipText: {
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
        numPercentiles: 10,                   // Number of quartiles/quintiles/deciles/etc. to display in stats
    }

    theme: ThemeConfig = THEME;

    timeline: TimelineConfig = {
        autoloadOnFocusAfterMinutes: 5,       // Autoload new toots if timeline is this old (and feature is enabled)
        defaultLoadingMsg: "Loading (first time can take up to a minute or so)",   // Message when first loading toots
        defaultNumDisplayedToots: 20,         // Default number of toots displayed in the timeline

        guiCheckboxLabels: {
            allowMultiSelect: {
                label: `Filter Multiselect`,
                tooltipText: "Allow selecting multiple filter options at once.",
            },
            autoupdate: {
                label: `Auto Update`,
                tooltipText: "Automatically update the timeline when you focus this browser tab.",
            },
            hideSensitive: {
                label: `Hide Sensitive`,
                tooltipText: "Hide images marked as sensitive (NSFW etc.) behind a click through.",
            },
            showFilterHighlights: {
                label: `Filter Highlights`,
                tooltipText: `Show colored highlighting for notable filter options.`,
            },
            showLinkPreviews: {
                label: `Link Previews`,
                tooltipText: "Show the full preview card for embedded links.",
            },
            stickToTop: {
                label: `Stick Control Panel To Top`,
                tooltipText: `Keep control panel on screen while scrolling.`,
            }
        },

        loadTootsButtons: {
            loadNewToots: {
                label: "(load new toots)",
                tooltipText: "Load toots created since the last time you loaded toots.",
            },
            loadOldToots: {
                label: "(load old toots)",
                tooltipText: "Load more toots but starting from the oldest toot in your feed and working backwards",
            },
            loadUserDataForAlgorithm: {
                label: "(load more algorithm data)",
                tooltipText: "Use more of your Mastodon activity to refine the algorithm",
            },
        },

        loadingErroMsg: `Currently loading, please wait a moment and try again.`,  // Error message when busy
        noTootsMsg: "No toots in feed! Maybe check your filters settings?", // Message when no toots are available
        numTootsToLoadOnScroll: 10,           // Number of toots to load on scroll
        tooltips: {
            accountTooltipDelayMS: 100,       // Delay for account tooltips in milliseconds
            defaultTooltipDelayMS: 800,       // Default delay for tooltips in milliseconds;
        }
    }

    toots: TootConfig = {
        imageHeight: 314,                     // Default height for images in toots
        maxPreviewCardLength: 350,            // Maximum length of preview card description
        scoreDigits: 3,                       // Number of digits to display in the score
    }

    trending: TrendingConfig = {
        maxLengthForMulticolumn: 55,          // Maximum length of a trending object label to use multicolumn layout
        panels:  {
            [TagTootsCategory.FAVOURITED]: {
                initialNumShown: 40,
                objTypeLabel: "of your favourite hashtags",
                title: "Hashtags You Often Favourite",
            },
            [TrendingType.LINKS]: {
                hasCustomStyle: true,        // TODO: this sucks
                initialNumShown: 30,
                objTypeLabel: `trending ${TrendingType.LINKS}`,
            },
            [TagTootsCategory.PARTICIPATED]: {
                initialNumShown: 40,
                objTypeLabel: "of your hashtags",
                title: "Hashtags You Often Post About",
            },
            [TrendingType.SERVERS]: {
                description: "The Mastodon servers all these trending links, toots, and hashtags came from, sorted by the percentage of that server's monthly active users you follow:",
                initialNumShown: 40,        // TODO: unused
                title: "Servers Telling Us What's Trending In The Fediverse",
            },
            [TagTootsCategory.TRENDING]: {
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
