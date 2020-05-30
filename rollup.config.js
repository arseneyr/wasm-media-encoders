import typescript from "rollup-plugin-ts";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import babel from "@rollup/plugin-babel";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

const mainConfig = {
  input: "src/encoder.ts",
  output: {
    file: "dist/index.js",
    format: "cjs",
    plugins: [...(isProd ? [terser()] : [])],
  },

  plugins: [json(), typescript(), babel({ babelHelpers: "bundled" })],
};

const umdConfig = {
  ...mainConfig,
  output: {
    ...mainConfig.output,
    file: "dist/umd/encoder.min.js",
    name: "WasmEncoder",
    format: "umd",
  },
};

export default [mainConfig, umdConfig];
