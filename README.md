# wasm-media-encoders

The LAME MP3 and Ogg Vorbis audio encoders, compiled to minimal WebAssembly and ready for use in the browser or Node.

## Why?

While some browsers have native encoding using the [`MediaRecorder` API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder), it only supports a [small number of codecs](https://stackoverflow.com/questions/41739837/all-mime-types-supported-by-mediarecorder-in-firefox-and-chrome).

This package aims to fill the gap by compiling the reference LAME and Ogg Vorbis encoders to WebAssembly. The resulting package is tiny and fast:

| Encoder    | JS\*    | WASM    | Combined + Gzipped |
| ---------- | ------- | ------- | ------------------ |
| MP3        | 3.3 KiB | 130 KiB | **66 KiB**         |
| Ogg Vorbis | 3.3 KiB | 440 KiB | **158 KiB**        |

<sub>\*When using ESNext syntax and no polyfills</sub>

## Installation

```
yarn add wasm-media-encoders
```

or

```
npm install wasm-media-encoders
```

## Getting started

With webpack or `.mjs` file in Node 12+:

```js
import { createMp3Enoder, createOggEncoder } from "wasm-media-encoders";

createOggEncoder().then((encoder) => {
  /* Configure and use the encoder */
});
createMp3Encoder().then((encoder) => {
  /* Configure and use the encoder */
});
```

With a `<script>` tag:

```html
<script src="https://unpkg.com/wasm-media-encoders/dist/umd/WasmMediaEncoder.min.js"></script>
<script>
  // The UMD package will fetch() the WASM binaries from
  // unpkg.com by default to reduce size

  WasmMediaEncoder.createMp3Encoder().then((encoder) => {
    /* Configure and use the encoder */
  });
</script>
```

Using CommonJS in Node:

```js
const { createMp3Encoder } = require("wasm-media-encoders");
createMp3Encoder().then((encoder) => {
  /* Configure and use the encoder */
});
```

If you'd like to use ESNext syntax and transpile yourself, use the `wasm-media-encoders/esnext` path.

## Example usage

```js
createMp3Encoder().then((encoder) => {
  encoder.configure({
    sampleRate: 48000,
    channels: 2,
    vbrQuality: 2,
  });

  let outBuffer = new Uint8Array(1024 * 1024);
  let offset = 0;
  let moreData = true;

  while (true) {
    const mp3Data = moreData
      ? encoder.encode([
          pcm_l /* Float32Array of left channel PCM data */,
          pcm_r /* Float32Array of right channel PCM data */,
        ])
      : /* finalize() returns the last few frames */
        encoder.finalize();

    /* mp3Data is a Uint8Array that is still owned by the encoder and MUST be copied */

    if (mp3Data.length + offset > outBuffer.length) {
      const newBuffer = new Uint8Array(mp3Data.length + offset);
      newBuffer.set(outBuffer);
      outBuffer = newBuffer;
    }

    outBuffer.set(mp3Data, offset);
    offset += mp3Data.length;

    if (!moreData) {
      break;
    }

    moreData = false;
  }

  return new Uint8Array(outBuffer.buffer, 0, offset);

  /* Or encoder can be reused without calling createEncoder() again:

  encoder.configure({...new params})
  encoder.encode()
  encoder.finalize() */
});
```

## Reducing bundle size

By default, this package inlines the WASM binary as a base64-encoded data URL. This make importing the encoder easy, but also increases the bundle size by about 30%. With webpack, you can load the WASM directly (found in `wasm-media-encoders/wasm/(mp3|ogg).wasm`), passing the URL as the second parameter to `createEncoder()`.

### Webpack v4

Besides using `file-loader`, you also need to disable WASM parsing in the webpack config:

```js
import { createEncoder } from "wasm-media-encoders";
import wasm from "file-loader!wasm-media-encoders/wasm/mp3.wasm";

createEncoder("audio/mpeg", wasm).then((encoder) => {
  /* Now mp3.wasm will be copied to output dir by webpack and fetch()ed at runtime */
});
```

```js
// webpack.config.js

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: "javascript/auto",
      },
    ],
  },
};
```

### Webpack v5

Using asset modules and [URL assets](https://webpack.js.org/guides/asset-modules/#url-assets) is easy in webpack v5:

```js
import { createEncoder } from "wasm-media-encoders";

createEncoder(
  "audio/mpeg",
  new URL("wasm-media-encoder/wasm/mp3", import.meta.url)
).then((encoder) => {
  /* Now mp3.wasm will be copied to output dir by webpack and fetch()ed at runtime */
});
```

## API

### Named exports:

### **`createMp3Encoder(): Promise<WasmMediaEncoder>`**

### **`createOggEncoder(): Promise<WasmMediaEncoder>`**

### **`createEncoder(mimeType, wasm, moduleCallback?): Promise<WasmMediaEncoder>`**

The first two named exports use inline base-64 encoded WASM binaries (or `fetch()` from unpkg.com in the case of UMD). Tree-shaking on webpack should prevent unused encoders from being included in the final bundle.

| Parameter        | Type                                                        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mimeType`       | `String`                                                    | The MIME type of the encoder to create. Supported values are `'audio/mpeg'` (MP3) or `'audio/ogg'` (Ogg Vorbis)                                                                                                                                                                                                                                                                                                                               |
| `wasm`           | `String \| ArrayBuffer \| Uint8Array \| WebAssembly.Module` | A URL, [base64 data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs), buffer, or compiled `WebAssembly.Module` representing the WASM binary for the specific `mimeType`. The WASM binaries are included in the package under `wasm-media-encoders/wasm/(mp3\|ogg).wasm`. Non-data URLs are not supported in Node; use [`node-fetch`](https://github.com/node-fetch/node-fetch) if this is something you need. |
| `moduleCallback` | `((module: WebAssembly.Module) => void) \| undefined`       | Optionally, a callback that will be called with the compiled WebAssembly module. You can cache this module client-side and pass it as the `wasm` parameter to avoid fetching and compiling it every time.                                                                                                                                                                                                                                     |

## `WasmMediaEncoder`

### **`configure(options): void`**

Configures the encoder. This method can be called at any time to reset the state of the encoder, including after `finalize()`.

The options object is a union of common properties and encoder-specific ones. All common options are required.

**Common options:**
| Property | Type | Description |
|-|-|-|
| `channels` | `Number` | The number of channels to be encoded. Currently only `1` or `2` channels are supported.|
|`sampleRate` | `Number` | Sample rate of data to be encoded, in hertz. |

**Options for MIME type `audio/mpeg` (MP3):**

`vbrQuality` and `bitrate` are mutually exclusive.
| Property | Type | Default | Description |
|-|-|-|-|
|`vbrQuality`| `Number \| undefined` | `4.0` | Variable Bitrate (VBR) quality for the LAME encoder, from 0.0 (best quality) to 9.999 (worst quality). See [here](https://wiki.hydrogenaud.io/index.php?title=LAME#Recommended_settings_details) for details.|
|`bitrate`| `Number \| undefined` | | Constant bitrate in kbit/s. Valid bitrates are 8, 16, 24, 32, 40, 48, 64, 80, 96, 112, 128, 160, 192, 224, 256, or 320.|

**Options for MIME type `audio/ogg` (Ogg Vorbis):**

| Property     | Type                  | Default | Description                                                                                                                                                                                                                                    |
| ------------ | --------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vbrQuality` | `Number \| undefined` | `3.0`   | Variable Bitrate (VBR) quality for the Vorbis encoder, from -1.0 (worst quality) to 10.0 (best quality). See [here](https://wiki.hydrogenaud.io/index.php?title=Recommended_Ogg_Vorbis#Recommended_Encoder_Settings) for approximate bitrates. |

### **`encode(samples): Uint8Array`**

Encodes PCM samples and returns a `Uint8Array`. You may call this method repeatedly to add more samples (e.g. if streaming in PCM data). May return a `Uint8Array` of length zero. **The returned `Uint8Array` is owned by the encoder and MUST be copied before any other encoder methods are called.**
| Parameter | Type | Description |
| - | - | - |
|`samples`| `Float32Array[]` | A `channels`-length array of `Float32Array` representing the PCM data to encode. Each sample must be in the range of `-1.0` to `1.0` |

### **`finalize(): Uint8Array`**

Flushes the encoder and returns the last few encoded samples. May return a `Uint8Array` of length zero. **The returned `Uint8Array` is owned by the encoder and MUST be copied before any other encoder methods are called.**

## Building

### Dev Container

The easiest way to get started is by creating a **development container** using the included `.devcontainer/devcontainer.json`. Tools that support dev containers can be found [here](https://containers.dev/supporting). Development containers require a Docker or Podman installation. Full instructions for Visual Studio Code can be found [here](https://code.visualstudio.com/docs/devcontainers/containers).

### Manually setting up environment

To manually set up a development environment, you must install the following prerequisites:

1. [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html#installation-instructions-using-the-emsdk-recommended) (v2.0.8)

   _Note: The SDK should also include Node 12_

2. _(Optional)_ Yarn

   ```
   npm i -g yarn
   ```

   The correct version of yarn is checked into the repo under `.yarn/releases` and is not required to build. However installing yarn will make CLI operations easier.

### Building

To create a release build:

```
make
```

## License

This project is licensed under the terms of the **MIT** license.
