/*
 * Simple node.js webserver w/out framework: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Node_server_without_framework
 */

const path = require("path");

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshTypeScript = require('react-refresh-typescript');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const webpack = require("webpack");

const isDevelopment = process.env.NODE_ENV !== 'production';
const envMsg = `* [WEBPACK] process.env.NODE_ENV: ${process.env.NODE_ENV} *`;
console.log(`${'*'.repeat(envMsg.length)}\n${envMsg}\n${'*'.repeat(envMsg.length)}`);
console.log(`\nprocess.env.FEDIALGO_DEBUG: ${process.env.FEDIALGO_DEBUG}\n\n`);

// Github pages only lets you deploy from docs/ folder
const outputDir = process.env.NODE_ENV == 'production' ? 'docs' : 'dist';


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
            maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
            skipWaiting: true,
        }),
        new webpack.EnvironmentPlugin({
            FEDIALGO_HOMEPAGE: require('./package.json').homepage,
            FEDIALGO_VERSION: require('./package.json').version,
        }),
    ].filter(Boolean),

    devServer: {
        compress: true,
        historyApiFallback: true,
        hot: true,
        port: 3000,
    },
};
