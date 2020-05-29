import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import replace from "@rollup/plugin-replace";
import pkg from "./package.json";
import babel from "@rollup/plugin-babel";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

const mainConfig = {
  input: "src/encoder.ts",
  output: {
    file: "dist/index.js",
    format: "cjs",
  },

  plugins: [
    replace({
      __WASM_URL_PREFIX__: `https://unpkg.com/wasm-encoders${
        isProd ? `@${pkg.version}` : ""
      }/wasm/`,
    }),
    typescript(),
    babel(),
  ],
};

const esConfig = {
  ...mainConfig,
  output: { file: "dist/es/index.js", format: "es" },
};

const umdConfig = {
  ...mainConfig,
  output: {
    file: "dist/umd/encoder.min.js",
    name: "WasmEncoder",
    format: "umd",
    plugins: [terser()],
  },
};

export default [mainConfig, esConfig, umdConfig];
