interface IWasmEncoder {
  enc_init(sample_rate: number, channel_count: number, params: number): number;
  enc_encode(cfg: number, num_samples: number): number;
  enc_flush(cfg: number): number;
  enc_free(cfg: number): void;
  enc_get_pcm(cfg: number, num_samples: number): number;
  enc_get_out_buf(cfg: number): number;
  malloc(size: number): number;
  free(ptr: number): void;
  HEAPF32: Float32Array;
  HEAP32: Int32Array;
  HEAPU8: Uint8Array;
  _initialize(): void;
  memory: WebAssembly.Memory;
}

function intArrayFromBase64(s: string) {
  try {
    //@ts-ignore
    if (__maybeNode__ && Buffer) {
      return Buffer.from(s, "base64");
    }
    var decoded = atob(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0; i < decoded.length; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error("Converting base64 string to bytes failed.");
  }
}

function parseDataUrl(url: string) {
  const parts = url.split(",");
  if (
    parts.length !== 2 ||
    /^data:(application\/octet-stream|application\/wasm);base64$/.test(
      parts[0]
    ) === false
  ) {
    return null;
  }

  return intArrayFromBase64(parts[1]).buffer;
}

export default async function (
  wasm: BufferSource | WebAssembly.Module | string
) {
  const imports = {
    wasi_snapshot_preview1: { proc_exit: () => {} },
    env: { emscripten_notify_memory_growth },
  };
  const wasmBufferOrModule =
    typeof wasm === "string"
      ? parseDataUrl(wasm) ??
        (!WebAssembly.instantiateStreaming &&
          (await (await fetch(wasm)).arrayBuffer()))
      : wasm;

  const output = await (wasmBufferOrModule
    ? WebAssembly.instantiate(wasmBufferOrModule, imports)
    : WebAssembly.instantiateStreaming(fetch(wasm as string), imports));

  const { memory, _initialize, ...rest } = ((output as any).instance || output)
    .exports as IWasmEncoder;

  const ret = {
    ...rest,
    module: (output as { module?: WebAssembly.Module }).module,
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
