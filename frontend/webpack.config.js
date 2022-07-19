const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

var path = require('path');

module.exports = (env, argv) => {
  // console.log(env);
  return {
    entry: ['./src/index.tsx'],
    output: {
      filename: 'static/js/[name].[contenthash:8].js',
      path: path.resolve(__dirname, 'build'),
      chunkFilename: 'static/js/[name].[contenthash:8].chunk.js'
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.jsx?$/,
          resolve: { extensions: ['.js', '.jsx'] },
          loader: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            'sass-loader'
          ]
        },
        {
          test: /\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)/,
          use: 'url-loader'
        },
        {
          test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
          type: 'asset/resource'
        }
      ]
    },
    stats: {
      cached: false,
      cachedAssets: false,
      chunks: false,
      chunkModules: false,
      chunkOrigins: false,
      modules: false
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        "~": path.resolve(__dirname, "src/"),
      },
    },
    optimization: {
      splitChunks: { chunks: 'all' },
      minimize: true
    },
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'build')
      },
      open: env.BROWSER === 'none' ? false : true,
      historyApiFallback: true,
      compress: true,
      port: 3000,
      hot: true,
      devMiddleware: {
        stats: {
          modules: false
        }
      },
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
        progress: false,
      },
    },
    target: "web",
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({ template: './public/index.html' }),
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css'
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/assets',
            to: 'assets',
            noErrorOnMissing: true
          }
        ]
      })
    ]
  };
};
