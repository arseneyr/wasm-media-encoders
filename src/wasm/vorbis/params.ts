import OggModule from "../build/ogg";

interface OggParams {
  vbrQuality?: number;
}

function parseOggParams(params: OggParams) {
  const vbrQuality = params.vbrQuality ?? 3;

  if (vbrQuality < -1 || vbrQuality > 10) {
    throw new Error(`Invalid VBR quality ${vbrQuality}`);
  }

  const ret = new Int32Array(1);
  new Float32Array(ret.buffer)[0] = vbrQuality;
  return ret;
}

export const OggParams = {
  mimeType: "audio/ogg" as const,
  parseParams: parseOggParams,
  wasmFilename: "ogg.wasm",
  module: OggModule,
};
