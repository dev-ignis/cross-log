// Test configuration for Webpack
const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    main: './test-app.ts',
    edge: './test-edge.ts',
    browser: './test-browser.ts',
    node: './test-node.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist-webpack'),
    filename: '[name].bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'cross-log': path.resolve(__dirname, '../../dist/index.js'),
      'cross-log/edge': path.resolve(__dirname, '../../dist/adapters/edge.js'),
      'cross-log/browser': path.resolve(__dirname, '../../dist/adapters/browser.js'),
      'cross-log/node': path.resolve(__dirname, '../../dist/adapters/node.js'),
      'cross-log/next': path.resolve(__dirname, '../../dist/adapters/next.js')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};