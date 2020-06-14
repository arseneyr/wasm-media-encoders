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

const esConfig = {
  ...mainConfig,
  output: {
    format: "es",
    file: "dist/es/index.js",
    plugins: outputPlugins,
  },
};

const umdConfig = {
  input: "src/umd.ts",
  output: {
    file: "dist/umd/WasmMediaEncoder.min.js",
    name: "WasmMediaEncoder",
    format: "umd",
    plugins: outputPlugins,
  },
  plugins: [json(), ...plugins],
};

export default [mainConfig, esConfig, umdConfig];
