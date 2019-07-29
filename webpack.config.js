const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const extractCss = new ExtractTextPlugin("../css/styles.min.css")
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/js/index.js',
  mode: 'development',
  devtool: 'source-map',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'build/js')
  },
  module: {
    rules: [
      {
          test: /\.scss$/,
          use: extractCss.extract({ fallback: 'style-loader', use: [ 'css-loader', 'postcss-loader', 'sass-loader' ] })
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    extractCss,
    new HtmlWebpackPlugin({
        template: './src/html/index.html',
        hash: true,
        filename: '../html/index.html',
        minify: {
          collapseWhitespace: true
        }
    })
  ]
};