const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/app.js', // Your main JavaScript file is now in src
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'bundle.js', // Output bundle file
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'], // Use style-loader and css-loader for CSS files
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Your source HTML file is now in public
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // Serve from the public directory
    },
    compress: true,
    port: 9000,
  },
}; 