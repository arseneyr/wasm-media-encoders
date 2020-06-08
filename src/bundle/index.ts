//@ts-ignore
import wasmMp3 from "../wasm/build/mp3.wasm";
import {
  createEncoder as createEncoderBase,
  WasmMediaEncoder,
  SupportedMimeTypes,
} from "../encoder";

function createEncoder<T extends SupportedMimeTypes>(
  mimeType: T
): Promise<WasmMediaEncoder<T>> {
  switch (mimeType) {
    case "audio/mpeg":
      return createEncoderBase(mimeType, wasmMp3);
    default:
      // should throw error
      return createEncoderBase(mimeType);
  }
}

export { createEncoder, WasmMediaEncoder };
