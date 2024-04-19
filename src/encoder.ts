import { Mp3Params } from "./wasm/lame/params";
import { OggParams } from "./wasm/vorbis/params";
import EmscriptenModule from "./wasm/module";
import {
  version as packageVersion,
  name as packageName,
} from "../package.json";

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
type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;

type EncoderModuleCallback = (
  module: WebAssembly.Module,
  version: string
) => unknown;

const encoderConfigs: ConfigMap = {
  [Mp3Params.mimeType]: Mp3Params,
  [OggParams.mimeType]: OggParams,
};

class WasmMediaEncoder<MimeType extends SupportedMimeTypes> {
  private ref!: number;
  private channelCount!: number;

  private get_pcm(num_samples: number) {
    const pcm_ptr_ptr = this.module.enc_get_pcm(this.ref, num_samples);
    if (!pcm_ptr_ptr) {
      throw new Error("PCM buffer allocation failed!");
    }
    const pcm_ptrs = this.module.HEAP32.subarray(
      pcm_ptr_ptr >> 2,
      (pcm_ptr_ptr >> 2) + this.channelCount
    );
    return Array.from({ length: this.channelCount }, (_, i) =>
      this.module.HEAPF32.subarray(
        pcm_ptrs[i] >> 2,
        (pcm_ptrs[i] >> 2) + num_samples
      )
    );
  }

  private get_out_buf(size: number) {
    const ptr = this.module.enc_get_out_buf(this.ref);
    return this.module.HEAPU8.subarray(ptr, ptr + size);
  }

  private get_common_params(params: BaseEncoderParams) {
    switch (params.channels) {
      case 1:
      case 2:
        break;
      default:
        throw new Error(`Invalid channel count ${params.channels}`);
    }
    if (typeof params.sampleRate != "number") {
      throw new Error(`Invalid sample rate ${params.sampleRate}`);
    }

    return new Uint32Array([params.channels, params.sampleRate]);
  }

  private get_string(ptr: number) {
    const nullBytePtr = this.module.HEAPU8.indexOf(0, ptr);
    const stringBuffer = this.module.HEAPU8.slice(ptr, nullBytePtr);
    return String.fromCharCode(...stringBuffer);
  }

  private constructor(
    public readonly mimeType: MimeType,
    private readonly module: Unpromisify<ReturnType<typeof EmscriptenModule>>,
    private readonly parseParams: (
      params: EncoderParams<MimeType>
    ) => Int32Array,
    encoderCallback?: EncoderModuleCallback
  ) {
    if (!this.module.version) {
      throw new Error(
        `JS and WASM version mismatch. JS version: ${packageVersion} WASM version: unknown (< 0.7.0)`
      );
    }
    const wasmModuleVersion = this.get_string(this.module.version());
    if (packageVersion != wasmModuleVersion) {
      throw new Error(
        `JS and WASM version mismatch. JS version: ${packageVersion} WASM version: ${wasmModuleVersion}`
      );
    }
    encoderCallback?.(module.module, wasmModuleVersion);
  }

  public static async create<T extends SupportedMimeTypes>(
    mimeType: T,
    wasm: string | ArrayBuffer | Uint8Array | WebAssembly.Module,
    moduleCallback?: EncoderModuleCallback
  ): Promise<WasmMediaEncoder<T>> {
    const em_module = await EmscriptenModule(wasm);
    return new WasmMediaEncoder(
      mimeType,
      em_module,
      encoderConfigs[mimeType].parseParams,
      moduleCallback
    );
  }

  public configure(params: BaseEncoderParams & EncoderParams<MimeType>) {
    if (this.ref) {
      this.module.enc_free(this.ref);
      this.ref = 0;
    }
    const commonParamBuffer = this.get_common_params(params);
    const paramBuffer = this.parseParams(params);
    const paramAlloc = this.module.malloc(
      commonParamBuffer.byteLength + paramBuffer.byteLength
    );
    if (!paramAlloc) {
      throw new Error("Failed to allocate parameter buffer");
    }
    this.module.HEAP32.set(commonParamBuffer, paramAlloc >> 2);
    this.module.HEAP32.set(
      paramBuffer,
      (paramAlloc + commonParamBuffer.byteLength) >> 2
    );
    this.channelCount = params.channels;
    try {
      this.ref = this.module.enc_init(paramAlloc);
      if (!this.ref) {
        throw new Error("Encoder initialization failed!");
      }
    } finally {
      this.module.free(paramAlloc);
    }
  }

  public encode(samples: Float32Array[]) {
    const pcm = this.get_pcm(samples[0].length);
    pcm.forEach((b, i) => b.set(samples[i]));

    const bytes_written = this.module.enc_encode(this.ref, pcm[0].length);
    if (bytes_written < 0) {
      throw new Error(`Error while encoding ${bytes_written}`);
    }
    return this.get_out_buf(bytes_written);
  }

  public finalize() {
    const bytes_written = this.module.enc_flush(this.ref);
    if (bytes_written < 0) {
      throw new Error(`Error while encoding ${bytes_written}`);
    }

    return this.get_out_buf(bytes_written);
  }
}

const createEncoder = WasmMediaEncoder.create;
const jsLibraryVersion = () => `${packageName}-${packageVersion}`;

export { createEncoder, WasmMediaEncoder, jsLibraryVersion };
