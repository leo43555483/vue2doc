const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const path = require('path');
const TransformSFC = require('../src/plugins/TransformSFC');

const webpackConfig = {
  mode: 'production',
  entry: {},
  output: {
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: [
          // {
          //   loader: path.resolve(__dirname, '../src/loader.js'),
          // },
          {
            loader: 'vue-loader',
            options: {
              productionMode: true,
              compilerOptions: {
                preserveWhitespace: false,
              },
            },
          },
        ],
      },
      {
        test: /\.(js|jsx?)$/,
        use: [
          // {
          //   loader: path.resolve(__dirname, '../src/parsejs.js'),
          // },
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              cacheCompression: false,
              sourceMap: true,
            },
          },

        ],
        exclude: /node_modules/,
      },
      {
        test: /\.(scss|css)$/,
        use: [
          'vue-style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.(svg|otf|ttf|woff2?|eot|gif|png|jpe?g)(\?\S*)?$/,
        loader: 'url-loader',
        query: {
          limit: 10000,
          name: 'fonts/[name].[hash:7].[ext]',
        },
      },
    ],
  },
  performance: {
    hints: false,
  },
  plugins: [
    new ProgressBarPlugin(),
    new VueLoaderPlugin(),
    new FriendlyErrorsPlugin(),
    new TransformSFC(),
  ],
};

module.exports = function getWebpackConfig(entry, output) {
  console.log('getWebpackConfig', output);
  return {
    ...webpackConfig,
    entry: {
      ...webpackConfig.entry,
      ...entry,
    },
    output: {
      ...webpackConfig.output,
      ...output,
    },
  };
};
