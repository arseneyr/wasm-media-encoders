interface IWasmEncoder
  extends EmscriptenModule,
    EmscriptenModuleFactory<IWasmEncoder> {
  _enc_init(
    streaming: boolean,
    sample_rate: number,
    sample_count: number,
    channel_count: number,
    params: number
  ): number;
  _enc_encode(cfg: number, num_samples: number): number;
  _enc_flush(cfg: number): number;
  _enc_free(cfg: number): void;
  wasm: ArrayBuffer | WebAssembly.Module;
  onReady: (module: IWasmEncoder) => void;
}
declare const factory: IWasmEncoder;
export default factory;
