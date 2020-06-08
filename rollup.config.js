import typescript from "rollup-plugin-ts";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import babel from "@rollup/plugin-babel";
import url from "@rollup/plugin-url";
import minifyPrivates from "ts-transformer-minify-privates";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

const mainConfig = {
  input: "src/encoder.ts",
  output: {
    file: "dist/index.js",
    format: "cjs",
    plugins: [
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
    ],
  },

  plugins: [
    json(),
    typescript({
      transformers: ({ program }) => ({ before: [minifyPrivates(program)] }),
    }),
    babel({ babelHelpers: "bundled" }),
  ],
};

const umdConfig = {
  ...mainConfig,
  output: {
    ...mainConfig.output,
    file: "dist/umd/encoder.min.js",
    name: "WasmMediaEncoder",
    format: "umd",
  },
};

const bundleConfigs = ["index", "mp3"].map((f) => ({
  ...mainConfig,
  input: `src/bundle/${f}.ts`,
  output: {
    ...mainConfig.output,
    file: `dist/bundle/${f}.js`,
  },
  plugins: [
    url({ include: "**/*.wasm", limit: 1024 * 1024 }),
    ...mainConfig.plugins,
  ],
}));

export default [mainConfig, umdConfig, ...bundleConfigs];
