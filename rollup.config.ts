import json from "@rollup/plugin-json";
import url from "@rollup/plugin-url";
import resolve from "@rollup/plugin-node-resolve";
import ts from "rollup-plugin-ts";
import path from "path";
import type { RollupOptions } from "rollup";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

const plugins = ({
  typecheck = false,
  targets = "supports wasm",
  outDir = ".",
} = {}) => [
  url({ include: "**/*.wasm", limit: 1024 * 1024 * 8 }),
  json(),
  resolve(),
  ts({
    transpiler: "swc",
    transpileOnly: !typecheck,
    tsconfig: (config) => ({
      ...config,
      declarationDir: path.resolve("dist", outDir),
    }),
    swcConfig: {
      env: {
        targets,
      },
      minify: isProd,
      jsc: {
        minify: {
          mangle: true,
          compress: true,
        },
      },
    },
  }),
];

const mainConfig: RollupOptions = {
  input: "src/index.ts",
  output: {
    file: "dist/index.cjs",
    format: "cjs",
  },
  external: [/@swc\/helpers/],

  plugins: plugins({ targets: "supports wasm", typecheck: true }),
};

const esmConfig = {
  input: "src/index.ts",
  output: {
    format: "es",
    file: "dist/es/index.mjs",
  },
  external: [/@swc\/helpers/],

  plugins: plugins({
    targets: "supports es6-module and supports wasm",
    outDir: "es",
  }),
};

const esnextConfig = {
  input: "src/index.ts",
  output: {
    format: "es",
    file: "dist/esnext/index.mjs",
  },

  plugins: plugins({
    targets: "",
    outDir: "esnext",
  }),
};

const umdConfig = {
  input: "src/umd.ts",
  output: {
    file: "dist/umd/WasmMediaEncoder.min.js",
    name: "WasmMediaEncoder",
    format: "umd",
  },
  plugins: plugins({ outDir: "umd", typecheck: true }),
};

export default [mainConfig, esmConfig, esnextConfig, umdConfig];
