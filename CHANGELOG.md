# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
