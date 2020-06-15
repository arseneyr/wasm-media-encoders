import { compileModule } from "./compile";
import { Mp3Params } from "./wasm/lame/params";
import { OggParams } from "./wasm/vorbis/params";
import { IWasmEncoder } from "./wasm/types/wasmEncoder";

interface BaseEncoderParams {
  channels: 1 | 2;
  sampleRate: number;
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

type ConfigMap = MapDiscriminatedUnion<
  typeof Mp3Params | typeof OggParams,
  "mimeType"
>;

type EncoderParams<T extends keyof ConfigMap> = Parameters<
  ConfigMap[T]["parseParams"]
>[0];

export type SupportedMimeTypes = keyof ConfigMap;

class WasmMediaEncoder<MimeType extends SupportedMimeTypes> {
  private ref!: number;
  private channelCount!: number;

  private static readonly encoderConfigs: ConfigMap = {
    [Mp3Params.mimeType]: Mp3Params,
    [OggParams.mimeType]: OggParams,
  };

  private get_pcm(num_samples: number) {
    const pcm_ptr_ptr = this.module._enc_get_pcm(this.ref, num_samples);
    if (!pcm_ptr_ptr) {
      throw new Error("PCM buffer allocation failed!");
    }
    const pcm_ptrs = this.module.HEAP32.subarray(
      pcm_ptr_ptr >> 2,
      (pcm_ptr_ptr >> 2) + 2
    );
    return [...Array(this.channelCount).keys()].map((i) =>
      this.module.HEAPF32.subarray(
        pcm_ptrs[i] >> 2,
        (pcm_ptrs[i] >> 2) + num_samples
      )
    );
  }

  private get_out_buf(size: number) {
    const ptr = this.module._enc_get_out_buf(this.ref);
    return this.module.HEAPU8.subarray(ptr, ptr + size);
  }

  private constructor(
    public readonly mimeType: MimeType,
    private readonly module: IWasmEncoder,
    private readonly parseParams: (
      params: EncoderParams<MimeType>
    ) => Int32Array
  ) {}

  public static async create<T extends SupportedMimeTypes>(
    mimeType: T,
    wasm: string | ArrayBuffer | Uint8Array | WebAssembly.Module
  ): Promise<WasmMediaEncoder<T>> {
    if (!WasmMediaEncoder.encoderConfigs[mimeType]) {
      throw new Error(`Unsupported mimetype ${mimeType}`);
    }
    if (!wasm) {
      throw new Error("No WASM specified");
    }

    if (typeof wasm === "string") {
      wasm = await compileModule(wasm);
    }
    return new WasmMediaEncoder(
      mimeType,
      await WasmMediaEncoder.encoderConfigs[mimeType].module({ wasm }),
      WasmMediaEncoder.encoderConfigs[mimeType].parseParams
    );
  }

  public configure(params: BaseEncoderParams & EncoderParams<MimeType>) {
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
    this.channelCount = params.channels;
    try {
      this.ref = this.module._enc_init(
        params.sampleRate,
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

  public encode(samples: Float32Array[]) {
    const pcm = this.get_pcm(samples[0].length);
    pcm.forEach((b, i) => b.set(samples[i]));

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

const createEncoder = WasmMediaEncoder.create;

export { createEncoder, WasmMediaEncoder };
