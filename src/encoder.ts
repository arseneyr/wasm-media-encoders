import Module from "./wasm/build/index";
import { Deferred } from "./utils";
import { compileModule } from "./compile";
import Mp3Params from "./wasm/lame/params";
import { name, version } from "../package.json";

interface BaseEncoderParams {
  channels: 1 | 2;
  sampleRate: number;
  sampleCount?: number;
}

type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = T extends Record<
  K,
  V
>
  ? T
  : never;

type MapDiscriminatedUnion<T extends Record<K, string>, K extends keyof T> = {
  [V in T[K]]: DiscriminateUnion<T, K, V>;
};

type ParamMap = MapDiscriminatedUnion<typeof Mp3Params, "mimeType">;

type ParamParser<T extends keyof ParamMap> = ParamMap[T]["parseParams"];

type EncoderParams<T extends keyof ParamMap> = Parameters<ParamParser<T>>[0];

export type SupportedMimeTypes = keyof ParamMap;

class WasmEncoder<T extends SupportedMimeTypes> {
  private ref!: number;
  private channelCount!: number;
  private sampleCount!: number;

  private static readonly paramParsers: ParamMap = {
    [Mp3Params.mimeType]: Mp3Params,
  };

  private get pcm_l() {
    const ptr = this.module.HEAP32[this.ref >> 2];
    return this.module.HEAPF32.subarray(
      ptr >> 2,
      (ptr >> 2) + this.sampleCount
    );
  }
  private get pcm_r() {
    const ptr = this.module.HEAP32[(this.ref + 4) >> 2];
    return this.module.HEAPF32.subarray(
      ptr >> 2,
      (ptr >> 2) + this.sampleCount
    );
  }

  private realloc_pcm() {
    const realloc_one = (ptr_loc: number) => {
      this.module._free(this.module.HEAP32[ptr_loc >> 2]);
      const ret = this.module._malloc(this.sampleCount);
      if (!ret) {
        throw new Error("Failed to reallocate PCM buffer");
      }
      this.module.HEAP32[ptr_loc >> 2] = ret;
    };
    realloc_one(this.ref);
    if (this.channelCount === 2) {
      realloc_one(this.ref + 4);
    }
  }

  private get_out_buf(size: number) {
    const ptr = this.module.HEAP32[(this.ref + 8) >> 2];
    return this.module.HEAPU8.subarray(ptr, ptr + size);
  }

  private constructor(
    private readonly module: typeof Module,
    private readonly parseParams: ParamParser<T>
  ) {}

  public static async create<T extends SupportedMimeTypes>(
    mimeType: T,
    wasm?: string | ArrayBuffer | Uint8Array | WebAssembly.Module
  ): Promise<WasmEncoder<T>> {
    if (!WasmEncoder.paramParsers[mimeType]) {
      throw new Error(`Unsupported mimetype ${mimeType}`);
    }

    if (wasm === undefined) {
      wasm =
        `https://unpkg.com/${name}@${version}/wasm/` +
        WasmEncoder.paramParsers[mimeType].wasmFilename;
    }

    if (typeof wasm === "string") {
      wasm = await compileModule(wasm);
    }

    const isReady = new Deferred<typeof Module>();

    Module({
      wasm,
      onReady: isReady.resolve,
    });
    return new WasmEncoder(
      await isReady.promise,
      WasmEncoder.paramParsers[mimeType].parseParams
    );
  }

  public configure(params: BaseEncoderParams & EncoderParams<T>) {
    if (this.ref) {
      this.module._enc_free(this.ref);
      this.ref = 0;
    }
    const paramBuffer = this.parseParams(params);
    const paramAlloc = this.module._malloc(paramBuffer.byteLength);
    if (!paramAlloc) {
      throw new Error("Failed to allocate parameter buffer");
    }
    this.module.HEAP32.set(paramBuffer, paramAlloc >> 2);
    this.sampleCount = params.sampleCount || 128;
    this.channelCount = params.channels;
    try {
      this.ref = this.module._enc_init(
        params.sampleRate,
        this.sampleCount,
        params.channels,
        paramAlloc
      );
      if (!this.ref) {
        throw new Error("Encoder initialization failed!");
      }
    } finally {
      this.module._free(paramAlloc);
    }
  }

  public encode(pcm: Float32Array[]) {
    if (pcm[0].length > this.sampleCount) {
      this.sampleCount = pcm[0].length;
      this.realloc_pcm();
    }
    this.pcm_l.set(pcm[0]);
    this.pcm_r.set(pcm[1]);
    const bytes_written = this.module._enc_encode(this.ref, pcm[0].length);
    if (bytes_written < 0) {
      throw new Error(`Error while encoding ${bytes_written}`);
    }
    return this.get_out_buf(bytes_written);
  }

  public finalize() {
    const bytes_written = this.module._enc_flush(this.ref);
    if (bytes_written < 0) {
      throw new Error(`Error while encoding ${bytes_written}`);
    }

    return this.get_out_buf(bytes_written);
  }
}

const createEncoder = WasmEncoder.create;

export { createEncoder, WasmEncoder };
