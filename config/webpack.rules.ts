import type { ModuleOptions } from 'webpack';

export const rules: Required<ModuleOptions>['rules'] = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules[/\\].+\.node$/,
    use: 'node-loader',
  },
  // Handle .cjs files from @applemusic-like-lyrics FIRST
  {
    test: /\.cjs$/,
    include: /node_modules[\\/]@applemusic-like-lyrics/,
    type: 'javascript/auto',
  },
  {
    test: /[/\\]node_modules[/\\].+\.(?:mjs|node)$/,
    exclude: [
      /[/\\]node_modules[/\\]@applemusic-like-lyrics[/\\]/,
      /pixi/,
    ],
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
        wrapperCompatibility: true,
      },
    },
  },
  {
    test: /[/\\]node_modules[/\\].+\.js$/,
    exclude: [
      /[/\\]node_modules[/\\]@applemusic-like-lyrics[/\\]/,
      /\.cjs$/,
      /pixi/,
    ],
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
        wrapperCompatibility: true,
      },
    },
  },
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  },
  {
    test: /\.jsx?$/,
    use: {
      loader: 'babel-loader',
      options: {
        exclude: /node_modules/,
        presets: ['@babel/preset-react']
      }
    }
  },
];
