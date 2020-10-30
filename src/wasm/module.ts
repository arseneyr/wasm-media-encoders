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

export default async function (wasm: BufferSource | WebAssembly.Module) {
  const output = (await WebAssembly.instantiate(wasm, {
    wasi_snapshot_preview1: { proc_exit: () => {} },
    env: { emscripten_notify_memory_growth },
  })) as any;
  const { memory, _initialize, ...rest } = (output.instance || output)
    .exports as IWasmEncoder;

  const ret = { ...rest };

  function emscripten_notify_memory_growth() {
    ret.HEAPF32 = new Float32Array(memory.buffer);
    ret.HEAP32 = new Int32Array(memory.buffer);
    ret.HEAPU8 = new Uint8Array(memory.buffer);
  }
  emscripten_notify_memory_growth();
  _initialize();
  return ret;
}
