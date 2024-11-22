// webpack.config.js

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'production', // 'development' に変更可能
    entry: './source/views/script.ts',
    externals: {
        'agora-rtc-sdk-ng': 'AgoraRTC',
        'agora-rtm-sdk': 'AgoraRTM',
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/views'),
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            fs: false, 
            os: require.resolve('os-browserify/browser'), 
            crypto: require.resolve('crypto-browserify'), 
            http: require.resolve('stream-http'), 
            https: require.resolve('https-browserify'), 
            querystring: require.resolve('querystring-es3'),
            child_process: false, 
            zlib: require.resolve('browserify-zlib'), // Polyfill for 'zlib'
            vm: require.resolve('vm-browserify'), // Polyfill for 'vm'
            http2: false, // Disable 'http2' if unnecessary
            timers: require.resolve('timers-browserify'), // Polyfill for 'timers'
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.html$/,
                use: 'html-loader',
            },
        ],
    },
    plugins: [
    new HtmlWebpackPlugin({
            template: './source/views/index.ejs', // EJSテンプレートのパス
            filename: 'index.html', // 出力するHTMLファイル名
            title: '通話BOT参加ページ', // titleの値を指定
            inject: 'body', // スクリプトをbodyに注入
        }),
    ],
    optimization: {
        usedExports: true,
        splitChunks: {
            chunks: 'all', // コードを分割してパフォーマンスを向上
        },
    },
    devServer: {
        static: './dist',
        port: 3000,
        open: true,
    },
};
