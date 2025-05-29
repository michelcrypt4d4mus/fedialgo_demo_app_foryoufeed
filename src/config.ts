/*
 * Configuration variables for the application.
 */
import { CSSProperties } from "react";

const KB = 1024;
const MB = KB * KB;

type FilterConfig = {
    defaultMinTootsToAppear: number;
    maxOptionLength: number;
    minOptionsToShowSlider: number;
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
    feedBackgroundColor: CSSProperties['backgroundColor'];
    feedBackgroundColorLite: CSSProperties['backgroundColor'];
    followedTagColor: CSSProperties['color'];
    followedUserColor: CSSProperties['color'];
    followedUserColorFaded: CSSProperties['color'];
    participatedTagColor: CSSProperties['color'];
    participatedTagColorMin: CSSProperties['color'];
    trendingTagColor: CSSProperties['color'];
    trendingTagColorFaded: CSSProperties['color'];
};

type TimelineConfig = {
    autoloadOnFocusAfterMinutes: number;
    numTootsToLoadOnScroll: number;
    defaultNumDisplayedToots: number;
};

type TooltipConfig = {
    filterOptionDelay: number;
    gradientAdjustPctiles?: number[];
    headerDelay: number;
    minTagsForGradientAdjust?: number;
};

type TootConfig = {
    maxPreviewCardLength: number;
};

type TrendingConfig = {
    numUserHashtagsToShow: number;
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
    filters: FilterConfig = {
        defaultMinTootsToAppear: 5,          // Minimum number of toots for an option to appear in the filter
        maxOptionLength: 21,                 // Maximum length of a filter option label
        minOptionsToShowSlider: 30,          // Minimum number of options to show the slider & hide low count options
    }

    locale: LocaleConfig = {
        defaultLocale: 'en-CA',              // Default locale for the application
    }

    replies: ReplyConfig = {
        defaultAcceptedAttachments: {
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
        animationDuration: 500,              // Duration of stats animations in milliseconds
    }

    theme: ThemeConfig = {
        feedBackgroundColor: '#15202b',     // background color for the timeline
        feedBackgroundColorLite: '#bcddfd', // lighter background color for the application
        followedTagColor: 'yellow',           // Color for followed tags
        followedUserColor: 'cyan',            // Color for followed users
        followedUserColorFaded: '#2092a1',  // Faded color for followed users
        participatedTagColor: '#92a14a',    // Color for participated tags
        participatedTagColorMin: '#d8deb9', // Minimum color for participated tags
        trendingTagColor: 'firebrick',        // Color for trending tags
        trendingTagColorFaded: '#f08c8c',   // Faded color for trending tags
    }

    timeline: TimelineConfig = {
        autoloadOnFocusAfterMinutes: 5,      // Autoload new toots if timeline is this old (and feature is enabled)
        numTootsToLoadOnScroll: 10,          // Number of toots to load on scroll
        defaultNumDisplayedToots: 20,        // Default number of toots displayed in the timeline
    }

    tooltips: TooltipConfig = {
        filterOptionDelay: 500,              // Delay for filter option tooltips in milliseconds
        gradientAdjustPctiles: [0.95, 0.98], // Percentiles for gradient adjustment of participated tags
        headerDelay: 500,                    // Delay for header tooltips in milliseconds
        minTagsForGradientAdjust: 40,        // Minimum number of participated tags for gradient adjustment
    }

    toots: TootConfig = {
        maxPreviewCardLength: 350,           // Maximum length of preview card description
    }

    trending: TrendingConfig = {
        numUserHashtagsToShow: 40,           // Default number of user particiapted hashtags to show in trending section // TODO: not really a trending thing
    }

    weights: WeightsConfig = {
        defaultStepSize: 0.02,               // Default step size for weight sliders
        scalingMultiplier: 1.2,              // Multiplier for scaling weight sliders responsively
    }
};


const config = new Config();
export { config };
