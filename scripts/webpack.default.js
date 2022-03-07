import child_process from 'child_process'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CopyPlugin from 'copy-webpack-plugin'

function export_data(folder) {
  return new CopyPlugin({
    patterns: [
      {
        from: './scripts/packdata.js',
        to: `./data.${folder}.json`,
        async transform(js) {
          let stdout = ''
          await new Promise(resolve => {
            let proc = child_process.fork('./scripts/packdata.js', [ folder ], { stdio: 'pipe' })
            proc.stdout.on('data', s => stdout += s)
            proc.on('exit', resolve)
          })
          return stdout
        }
      }
    ]
  })
}

export default {
  mode: 'development',
  entry: './src/index.jsx',
  devtool: 'eval-cheap-source-map',
  output: {
    publicPath: '/wowstuff/dist/'
  },
  devServer: {
    static: {
      directory: '.',
      watch: false
    }
  },
  plugins: [
    new MiniCssExtractPlugin(),
    export_data('13.h-o-e'),
    export_data('14.h-o-e'),
    export_data('15.h-o-e'),
    export_data('16.h-o-e'),
    export_data('16.st0rm')
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
        //use: [ MiniCssExtractPlugin.loader, 'css-loader' ]
      },
      {
        test: /\.styl$/,
        exclude: /node_modules/,
        use: [ 'style-loader', 'css-loader', 'stylus-loader' ]
        //use: [ MiniCssExtractPlugin.loader, 'css-loader', 'stylus-loader' ]
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ '@babel/preset-react' ]
          }
        }
      }
    ]
  },
  experiments: {
    topLevelAwait: true
  }
}
