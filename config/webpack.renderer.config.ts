import type { Configuration } from "webpack";
import webpack from "webpack";
import path from "path";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";
rules.push(
  {
    test: /\.css$/,
    use: [{ loader: "style-loader" }, { loader: "css-loader" }],
  },
  {
    test: /\.scss$/,
    use: [
      { loader: "style-loader" },
      { loader: "css-loader" },
      { loader: "sass-loader" },
    ],
  },
  {
    test: /\.(woff|woff2|eot|ttf|otf)$/i,
    type: "asset/resource",
  },
  {
    test: /\.(png|jpg|jpeg|gif)$/i,
    type: "asset/resource",
  },
  {
    test: /\.svg$/,
    use: [
      {
        loader: "@svgr/webpack",
        options: {
          prettier: false,
          svgo: false,
          svgoConfig: {
            plugins: [{ removeViewBox: false }],
          },
          titleProp: true,
          ref: true,
        },
      },
    ],
  }
);

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins: [
    ...plugins,
    new webpack.DefinePlugin({
      __dirname: "window.__dirname",
    }),
  ],
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".scss", ".cjs"],
    alias: {
      "@": path.join(__dirname, "../src"),
      "@renderer": path.join(__dirname, "../src/renderer"),
      "@renderer-lrc": path.join(__dirname, "../src/renderer-lrc"),
      "@shared": path.join(__dirname, "../src/shared"),
      "@applemusic-like-lyrics/core": path.join(__dirname, "../node_modules/@applemusic-like-lyrics/core/dist/amll-core.js"),
      "@applemusic-like-lyrics/react": path.join(__dirname, "../node_modules/@applemusic-like-lyrics/react/dist/amll-react.js"),
      "@applemusic-like-lyrics/react-full": path.join(__dirname, "../node_modules/@applemusic-like-lyrics/react-full/dist/amll-react-framework.js"),
    },
    mainFields: ['module', 'main'],
  },
  externals: process.platform !== "darwin" ? ["fsevents"] : undefined,
};
