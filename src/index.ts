import { createEncoder, WasmMediaEncoder } from "./encoder";
//@ts-ignore
import wasmMp3 from "./wasm/build/mp3.wasm";
//@ts-ignore
import wasmOgg from "./wasm/build/ogg.wasm";

function createMp3Encoder() {
  return createEncoder("audio/mpeg", wasmMp3);
}

function createOggEncoder() {
  return createEncoder("audio/ogg", wasmOgg);
}

export { createEncoder, createMp3Encoder, createOggEncoder, WasmMediaEncoder };
