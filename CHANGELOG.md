# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.2] - 2020-11-09

### Added

- Untranspiled JS is now available via `wasm-media-encoders/esnext`

### Fixed

- The `browser` and UMD entries are now correctly transformed with Babel to support [all browsers that support WASM](https://caniuse.com/wasm). `@babel/runtime` is now a dependency for the `browser` entry.

## [0.6.1] - 2020-11-05

### Changed

- Browsers will now use `WebAssembly.instantiateStreaming()` for data URIs as well (if available).

### Removed

- `fetch()`ing from non-data URL in Node

## [0.6.0] - 2020-11-04

### Added

- Can now supply a callback to `createEncoder()` to get the compiled `WebAssembly.Module`
- Support for ESM modules in Node

### Changed

- Reduced JS size by about 40%
- Reduced LAME WASM size by about 4%
- Reduced OGG WASM size by about 3%

### Fixed

- Fixed an issue where encoding large buffers would return a detached `ArrayBuffer`.
- Bundling with webpack v4 no longer pulls in a `Buffer` polyfill.
