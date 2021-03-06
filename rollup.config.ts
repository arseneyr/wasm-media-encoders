import typescript, {
  TypescriptPluginOptions,
} from "@wessberg/rollup-plugin-ts";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
//@ts-ignore
import url from "@rollup/plugin-url";
import replace from "@rollup/plugin-replace";
import minifyPrivates from "ts-transformer-minify-privates";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

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

const plugins = ({
  maybeNode = true,
  tsConfig = {} as Partial<TypescriptPluginOptions>,
  targets = "supports wasm",
} = {}) => [
  url({ include: "**/*.wasm", limit: 1024 * 1024 * 8 }),
  json(),
  resolve(),
  commonjs(),
  typescript({
    include: ["src/**/*"],
    transformers: ({ program }) => ({ before: [minifyPrivates(program!)] }),
    babelConfig: {
      compact: true,
      presets: [
        [
          "@babel/preset-env",
          {
            targets,
            bugfixes: true,
          },
        ],
      ],
    },
    transpiler: "babel",
    ...tsConfig,
  }),
  replace({ __maybeNode__: JSON.stringify(maybeNode) }),
];

const mainConfig = {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "cjs",
    plugins: outputPlugins,
  },

  plugins: plugins({ targets: "node 10" }),
};

const esmConfig = {
  input: "src/index.ts",
  output: {
    plugins: outputPlugins,
    format: "es",
    file: "dist/es/index.js",
  },
  plugins: plugins({ targets: "node 10" }),
};

const esnextConfig = {
  input: "src/index.ts",
  output: {
    format: "es",
    file: "dist/esnext/index.mjs",
    plugins: outputPlugins,
  },
  plugins: plugins({
    tsConfig: { transpiler: "typescript" },
  }),
};

const browserConfig = {
  input: "src/index.ts",
  output: {
    format: "es",
    file: "dist/browser/index.js",
    plugins: outputPlugins,
  },
  external: [/@babel\/runtime/],
  plugins: plugins({ maybeNode: false }),
};

const umdConfig = {
  input: "src/umd.ts",
  output: {
    file: "dist/umd/WasmMediaEncoder.min.js",
    name: "WasmMediaEncoder",
    format: "umd",
    plugins: outputPlugins,
  },
  plugins: plugins(),
};

export default [mainConfig, esmConfig, esnextConfig, browserConfig, umdConfig];
