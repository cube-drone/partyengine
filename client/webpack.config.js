const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

let environment = process.env.NODE_ENV || "development";
let isProd = environment === 'production';

// ternary
// condition ? true : false;
console.warn("Mode: ", environment);

let options = {
    entry: {
        app: './src/app.js',
    },
    devServer: isProd ? {} : {
        allowedHosts: 'all',
        port: 44001,
        host: '0.0.0.0',
        hot: true,
        historyApiFallback: {
            rewrites: [
                { from: /^\/$/, to: '/index.html' },
            ]
        },
    },
    devtool: isProd ? false : 'inline-source-map',
    output: {
        filename: (pathData) => {
            return '[name].[contenthash].bundle.js';
        },
        path: path.resolve(__dirname, 'dist'),
    },
    mode: environment,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            plugins: [!isProd && require.resolve('react-refresh/babel')].filter(Boolean),
                        }
                    }
                ]
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                ]
            },
            {
                test: /\.styl$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'stylus-loader'
                ]
            },
            {
                test: /\.png$/,
                use: [
                    'file-loader?name=i/[hash].[ext]'
                ]
            }
        ],
    },
    optimization: {
        minimize: isProd,
        minimizer: [new TerserPlugin({
            terserOptions: {
                mangle: {
                    toplevel: true
                },
            }
        })],
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            title: "Party Engine",
            chunks: ['app'],
            template: 'index.html',
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css",
        }),
        new webpack.DefinePlugin({
            'ENVIRONMENT': JSON.stringify(environment),
            'API_ENDPOINT': isProd ? JSON.stringify('https://xoxi.ca/api') : JSON.stringify('http://party.local:60000/api'),
        }),
        !isProd && new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),
};

module.exports = options;