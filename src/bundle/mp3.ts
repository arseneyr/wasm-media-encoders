//@ts-ignore
import wasmUrl from "../wasm/build/mp3.wasm";
import { createEncoder, WasmMediaEncoder } from "../encoder";

const createMp3Encoder = createEncoder.bind(null, "audio/mpeg", wasmUrl);

export { createMp3Encoder as createEncoder, WasmMediaEncoder };
