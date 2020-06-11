export interface IWasmEncoder extends EmscriptenModule {
  _enc_init(sample_rate: number, channel_count: number, params: number): number;
  _enc_encode(cfg: number, num_samples: number): number;
  _enc_flush(cfg: number): number;
  _enc_free(cfg: number): void;
  _enc_get_pcm(cfg: number, num_samples: number): number;
  _enc_get_out_buf(cfg: number): number;
  wasm: ArrayBuffer | WebAssembly.Module;
}
