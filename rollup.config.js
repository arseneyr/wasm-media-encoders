import typescript from "rollup-plugin-ts";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import babel from "@rollup/plugin-babel";
import url from "@rollup/plugin-url";
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

const plugins = [
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

  plugins: [url({ include: "**/*.wasm", limit: 1024 * 1024 }), ...plugins],
};

const encoderConfig = {
  input: "src/encoder.ts",
  output: {
    file: "dist/encoder.js",
    format: "cjs",
    plugins: outputPlugins,
  },

  plugins,
};

const umdConfig = {
  ...encoderConfig,
  output: {
    file: "dist/umd/encoder.min.js",
    name: "WasmMediaEncoder",
    format: "umd",
    plugins: outputPlugins,
  },
};

export default [mainConfig, encoderConfig, umdConfig];
