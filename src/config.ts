/*
 * Configuration variables for the application.
 */
type FilterConfig = {
    defaultMinTootsToAppear: number;
    maxOptionLength: number;
    minOptionsToShowSlider: number; // Optional, used for filters with many options
};

type StatsConfig = {
    animationDuration: number;
};

type TooltipConfig = {
    filterOptionDelay: number;
    headerDelay: number;
}

type TrendingConfig = {
    numUserHashtagsToShow: number; // Default number of hashtags to show in trending section
}

type WeightsConfig = {
    defaultStepSize: number;
}

interface ConfigType {
    filters: FilterConfig;
    stats: StatsConfig;
    tooltips: TooltipConfig;
    weights: WeightsConfig;
};


// App level config that is not user configurable
class Config implements ConfigType {
    filters: FilterConfig = {
        defaultMinTootsToAppear: 5,         // Minimum number of toots for an option to appear in the filter
        maxOptionLength: 21,                // Maximum length of a filter option label
        minOptionsToShowSlider: 30,         // Minimum number of options to show the slider & hide low count options
    }

    stats: StatsConfig = {
        animationDuration: 500,             // Duration of stats animations in milliseconds
    }

    tooltips: TooltipConfig = {
        filterOptionDelay: 500,             // Delay for filter option tooltips in milliseconds
        headerDelay: 500,                   // Delay for header tooltips in milliseconds
    }

    trending: TrendingConfig = {
        numUserHashtagsToShow: 40,          // Default number of user particiapted hashtags to show in trending section // TODO: not really a trending thing
    }

    weights: WeightsConfig = {
        defaultStepSize: 0.02,              // Default step size for weight sliders
    }
};


const config = new Config();
export { config };
