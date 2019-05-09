const path = require('path');

module.exports = {
  entry: {
    message: './lib/message/Message.ts'
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, '../typescript/tsconfig.json')
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: '[name]/bundle.lib.js',
    path: path.resolve(__dirname, '../../lib')
  }
};
