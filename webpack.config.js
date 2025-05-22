/*
 * Simple node.js webserver w/out framework: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Node_server_without_framework
 */
require('dotenv-flow').config();
const path = require("path");

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshTypeScript = require('react-refresh-typescript');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const webpack = require("webpack");

// Github pages only lets you deploy from docs/ folder
const outputDir = process.env.BUILD_GITHUB_PAGES == 'true' ? 'docs' : 'dist';
const isDevelopment = process.env.NODE_ENV !== 'production';

const envMsgs = [`* [WEBPACK] process.env.NODE_ENV: ${process.env.NODE_ENV}`];
envMsgs.push(`* [WEBPACK] process.env.FEDIALGO_DEBUG: ${process.env.FEDIALGO_DEBUG}`);
envMsgs.push(`* Building to outputDir: ${outputDir} (BUILD_GITHUB_PAGES=${process.env.BUILD_GITHUB_PAGES})`);
const envMsgBar = '*'.repeat(Math.max(...envMsgs.map(msg => msg.length)));
console.log('\n' + [envMsgBar, ...envMsgs, envMsgBar].join('\n') + '\n');


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
                use: ["style-loader", "css-loader"],
            },
        ],
    },

    plugins: [
        isDevelopment && new ReactRefreshWebpackPlugin(),
        // new BundleAnalyzerPlugin(),  // Generates an analysis of the bundle whenever webpack is run
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
