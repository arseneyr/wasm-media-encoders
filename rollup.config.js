import typescript from "rollup-plugin-ts";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import babel from "@rollup/plugin-babel";
import url from "@rollup/plugin-url";
import replace from "@rollup/plugin-replace";
import minifyPrivates from "ts-transformer-minify-privates";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

const outputPlugins = [
  ...(isProd
    ? [
        terser({
          mangle: {
            properties: {
              regex: /_private_/,
            },
          },
        }),
      ]
    : []),
];

const plugins = (maybeNode) => [
  replace({ __maybeNode__: maybeNode }),
  url({ include: "**/*.wasm", limit: 1024 * 1024 * 8 }),
  json(),
  typescript({
    transformers: ({ program }) => ({ before: [minifyPrivates(program)] }),
  }),
  babel({ babelHelpers: "bundled" }),
];

const mainConfig = {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "cjs",
    plugins: outputPlugins,
  },

  plugins: plugins(true),
};

const esConfig = {
  ...mainConfig,
  output: {
    format: "es",
    file: "dist/es/index.mjs",
    plugins: outputPlugins,
  },
};

const webpackConfig = {
  ...esConfig,
  output: {
    format: "es",
    file: "dist/browser/index.js",
    plugins: outputPlugins,
    sourcemap: true,
  },
  plugins: plugins(false),
};

const umdConfig = {
  input: "src/umd.ts",
  output: {
    file: "dist/umd/WasmMediaEncoder.min.js",
    name: "WasmMediaEncoder",
    format: "umd",
    plugins: outputPlugins,
  },
  plugins: plugins(true),
};

export default [mainConfig, esConfig, webpackConfig, umdConfig];
