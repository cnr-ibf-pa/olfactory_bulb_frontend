const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.js',
    },
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',
        allowedHosts: "all",
        host: '0.0.0.0',
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Olfactory Bulb',
        }),
        new HtmlWebpackPlugin({
            template: './src/callback.html',
            inject: true,
            chunks: ['callback'],
            filename: 'callback.html'
        })
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },

    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ],

    },
};