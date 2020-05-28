/// <reference types="emscripten" />

declare module "wasm" {
  export interface IWasmEncoder
    extends EmscriptenModule,
      EmscriptenModuleFactory<IWasmEncoder> {
    _mrp_init(
      streaming: boolean,
      sample_rate: number,
      sample_count: number,
      channel_count: number,
      params: number
    ): number;
    _mrp_encode(cfg: number, num_samples: number): number;
    _mrp_flush(cfg: number): number;
    _mrp_free(cfg: number): void;
    wasm: ArrayBuffer | WebAssembly.Module;
    onReady: (module: IWasmEncoder) => void;
  }
  const factory: IWasmEncoder;
  export default factory;
}

declare module "*.wasm" {
  const module: string;
  export default module;
}

declare module "*/dist/worklet.js" {
  const dataUrl: string;
  export default dataUrl;
}
