//@ts-ignore
import wasmUrl from "../wasm/build/mp3.wasm";
import WasmEncoder from "../encoder";

type Mp3Encoder = WasmEncoder<"audio/mpeg">;

const Mp3Encoder = WasmEncoder.bind(null, "audio/mpeg", wasmUrl);

export default Mp3Encoder;
