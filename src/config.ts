/*
 * Configuration variables for the application.
 */
type FilterConfig = {
    maxOptionLength: number;
};

type StatsConfig = {
    animationDuration: number;
};

type TooltipConfig = {
    filterOptionDelay: number;
    headerDelay: number;
}

interface ConfigType {
    filters: FilterConfig;
    stats: StatsConfig;
    tooltips: TooltipConfig;
};


// App level config that is not user configurable
class Config implements ConfigType {
    filters: FilterConfig = {
        maxOptionLength: 21,  // Maximum length of a filter option label
    }

    stats: StatsConfig = {
        animationDuration: 500, // Duration of stats animations in milliseconds
    }

    tooltips: TooltipConfig = {
        filterOptionDelay: 500, // Delay for filter option tooltips in milliseconds
        headerDelay: 500, // Delay for header tooltips in milliseconds
    }
};


const config = new Config();
export { config };
