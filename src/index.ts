//@ts-ignore
import wasmMp3 from "./wasm/build/mp3.wasm";
//@ts-ignore
import wasmOgg from "./wasm/build/ogg.wasm";

import {
  createEncoder as createEncoderBase,
  WasmMediaEncoder,
  SupportedMimeTypes,
} from "./encoder";

function createEncoder<T extends SupportedMimeTypes>(
  mimeType: T
): Promise<WasmMediaEncoder<T>> {
  switch (mimeType) {
    case "audio/mpeg":
      return createEncoderBase("audio/mpeg", wasmMp3);
    case "audio/ogg":
      return createEncoderBase("audio/ogg", wasmOgg);
    default:
      return createEncoderBase(mimeType);
  }
}

export { createEncoder, WasmMediaEncoder };
