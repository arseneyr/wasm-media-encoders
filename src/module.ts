import { XOR } from "./utils";

interface IWasmEncoder {
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
  HEAPF32: Float32Array;
  HEAP32: Int32Array;
  HEAPU8: Uint8Array;
  _initialize(): void;
  memory: WebAssembly.Memory;
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
) {
  const imports = {
    wasi_snapshot_preview1: {
      proc_exit: (code: number) => {
        throw new Error(`fatal error exit(${code})`);
      },
    },
    env: { emscripten_notify_memory_growth },
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

  const { memory, _initialize, ...rest } = (output.instance || output)
    .exports as unknown as IWasmEncoder;

  const ret = {
    ...rest,
    module: output.module || wasm,
  };

  function emscripten_notify_memory_growth() {
    ret.HEAPF32 = new Float32Array(memory.buffer);
    ret.HEAP32 = new Int32Array(memory.buffer);
    ret.HEAPU8 = new Uint8Array(memory.buffer);
  }
  emscripten_notify_memory_growth();
  _initialize();
  return ret;
}
