/*
 * Webpack configuration for the FediAlgo Demo App.
 */
require('dotenv-flow').config();
const glob = require("glob");
const path = require("path");

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const chalk = require('chalk');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ReactRefreshTypeScript = require('react-refresh-typescript');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const webpack = require("webpack");
const { PurgeCSSPlugin } = require("purgecss-webpack-plugin");

const ENV_VARS_TO_LOG = ['NODE_ENV', 'FEDIALGO_DEBUG', 'BUMM'];
const ENV_VAR_LOG_PREFIX = '* [WEBPACK]';


// Environment variables
const isDevelopment = process.env.NODE_ENV !== 'production';
const outputDir = path.join(__dirname, process.env.BUILD_DIR);
const shouldAnalyzeBundle = process.env.ANALYZE_BUNDLE === 'true';
const getEnvVars = (varNames) => varNames.reduce((dict, v) => ({...dict, [v]: process.env[v]}), {});

const coloredValue = (v) => {
    if (typeof v == 'boolean') {
        return v ? chalk.green(v) : chalk.red(v);
    } else if (typeof v == 'number') {
        return chalk.cyan(v);
    } else if (typeof v == 'undefined') {
        return chalk.dim(v);
    } else {
        return chalk.magenta(`"${v}"`);
    }
};

const envVars = {
    ...getEnvVars(ENV_VARS_TO_LOG),
    isDevelopment,
    outputDir,
    shouldAnalyzeBundle,
};

const envMsgLines = Object.entries(envVars).map(([k, v]) => (
    `${chalk.dim(ENV_VAR_LOG_PREFIX)} ${chalk.bold(k)}: ${coloredValue(v)}`
));

const envMsgsBar = chalk.dim('*'.repeat(Math.max(...envMsgLines.map(msg => msg.length))));
console.log([envMsgsBar, ...envMsgLines, envMsgsBar].join('\n') + '\n');

console.log(process.env);

module.exports = {
    entry: "./src/index.tsx",
    output: {
        clean: true,  // Clean the cache each time we build
        filename: "bundle.js",
        path: path.resolve(__dirname, outputDir),
    },
    resolve: {
        extensions: [".js", ".json", ".tsx", ".ts"],
    },
    devtool: "inline-source-map",
    mode: isDevelopment ? 'development' : 'production',

    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('ts-loader'),
                        options: {
                            getCustomTransformers: () => ({
                                before: [isDevelopment && ReactRefreshTypeScript()].filter(Boolean),
                            }),
                            transpileOnly: isDevelopment,
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
        ],
    },

    plugins: [
        isDevelopment && new ReactRefreshWebpackPlugin(),
        shouldAnalyzeBundle && new BundleAnalyzerPlugin(),
        new CopyPlugin({
            patterns: [
                { from: 'assets', to: '' }, // copies all files from assets to dist/
                { from: 'public', to: '' }, // copies all files from public to dist/
            ],
        }),
        new Dotenv(),
        new HtmlWebpackPlugin({
            template: "./src/index.html",
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
        }),
        new PurgeCSSPlugin({
            paths: glob.sync(`${path.join(__dirname, "src")}/**/*`, { nodir: true }),
        }),
        new WorkboxWebpackPlugin.GenerateSW({
            // WorkboxWebpackPlugin docs: https://developer.chrome.com/docs/workbox/modules/workbox-webpack-plugin/
            clientsClaim: true,
            maximumFileSizeToCacheInBytes: 35 * 1024 * 1024,
            skipWaiting: true,
        }),
        new webpack.EnvironmentPlugin({
            FEDIALGO_DEBUG: process.env.FEDIALGO_DEBUG,
            FEDIALGO_HOMEPAGE: require('./package.json').homepage,
            FEDIALGO_VERSION: require('./package.json').version,
            QUICK_MODE: process.env.QUICK_MODE,
        }),
    ].filter(Boolean),

    devServer: {
        compress: true,
        historyApiFallback: true,
        hot: true,
        port: 3000,
    },
};
