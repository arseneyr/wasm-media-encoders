import { XOR } from "./utils";

interface IWasmEncoderPublic {
  enc_init(params: number): number;
  enc_encode(cfg: number, num_samples: number): number;
  enc_flush(cfg: number): number;
  enc_free(cfg: number): void;
  enc_get_pcm(cfg: number, num_samples: number): number;
  enc_get_out_buf(cfg: number): number;
  version(): number;
  mime_type(): number;
  malloc(size: number): number;
  free(ptr: number): void;
  module: WebAssembly.Module;
  getInt32Array(ptr: number, length?: number): Int32Array;
  getUint8Array(ptr: number, length?: number): Uint8Array;
  getFloat32Array(ptr: number, length?: number): Float32Array;
  getString(ptr: number): string;
}

interface IWasmEncoderPrivate extends IWasmEncoderPublic {
  memory: WebAssembly.Memory;
  _initialize(): void;
}

function parseDataUrl(url: string) {
  const parts = url.split(",");
  if (
    parts.length !== 2 ||
    /^data:application\/(octet-stream|wasm);base64$/.test(parts[0]) === false
  ) {
    throw new Error("Passed non-data URI");
  }

  return Buffer.from(parts[1], "base64");
}

export default async function (
  wasm: BufferSource | WebAssembly.Module | string
): Promise<IWasmEncoderPublic> {
  const imports = {
    wasi_snapshot_preview1: {
      proc_exit: (code: number) => {
        throw new Error(`fatal error exit(${code})`);
      },
    },
    env: { emscripten_notify_memory_growth: () => {} },
  };

  if (typeof wasm === "string" && !WebAssembly.instantiateStreaming) {
    wasm =
      typeof fetch === "undefined"
        ? await parseDataUrl(wasm)
        : await (await fetch(wasm)).arrayBuffer();
  }

  const output = (await (typeof wasm === "string"
    ? WebAssembly.instantiateStreaming(fetch(wasm), imports)
    : WebAssembly.instantiate(wasm, imports))) as XOR<
    {
      instance: WebAssembly.Instance;
      module: WebAssembly.Module;
    },
    WebAssembly.Instance
  >;

  const ret: IWasmEncoderPrivate = {
    ...((output.instance || output).exports as unknown as IWasmEncoderPrivate),
    module: output.module || wasm,
    getInt32Array(ptr, length) {
      return new Int32Array(this.memory.buffer, ptr, length);
    },
    getFloat32Array(ptr, length) {
      return new Float32Array(this.memory.buffer, ptr, length);
    },
    getUint8Array(ptr, length) {
      return new Uint8Array(this.memory.buffer, ptr, length);
    },
    getString(ptr: number) {
      const buf = this.getUint8Array(ptr);
      const nullBytePtr = buf.indexOf(0);
      const stringBuffer = buf.slice(0, nullBytePtr);
      return String.fromCharCode(...stringBuffer);
    },
  };

  ret._initialize();
  return ret;
}
