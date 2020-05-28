import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import replace from "@rollup/plugin-replace";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

const mainConfig = {
  input: "src/encoder.ts",
  output: {
    dir: "dist",
    format: "es",
    plugins: [isProd && terser()],
  },

  plugins: [replace({ __WASM_URL_PREFIX__: "" }), typescript()],
};

export default [mainConfig];
