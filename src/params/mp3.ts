import { XOR } from "../utils";

type Mp3CbrValues =
  | 8
  | 16
  | 24
  | 32
  | 40
  | 48
  | 64
  | 80
  | 96
  | 112
  | 128
  | 160
  | 192
  | 224
  | 256
  | 320;

type Mp3Params = XOR<{ cbrRate?: Mp3CbrValues }, { vbrQuality?: number }>;

function parseMp3Params(params: Mp3Params) {
  switch (params.cbrRate) {
    case undefined:
    case 8:
    case 16:
    case 24:
    case 32:
    case 40:
    case 48:
    case 64:
    case 80:
    case 96:
    case 112:
    case 128:
    case 160:
    case 192:
    case 224:
    case 256:
    case 320:
      break;
    default:
      throw new Error(`Invalid constant bitrate ${(params as any).cbrRate}`);
  }

  if (params.vbrQuality !== undefined) {
    if (params.vbrQuality < 0 || params.vbrQuality >= 10) {
      throw new Error(`Invalid VBR quality: ${params.vbrQuality}`);
    }
  }

  const ret = new Int32Array(2);
  ret[0] = params.cbrRate ?? 0;
  new Float32Array(ret.buffer)[1] =
    params.vbrQuality ?? (params.cbrRate !== undefined ? -1 : 4);

  return ret;
}

export default {
  mimeType: "audio/mpeg" as const,
  parseParams: parseMp3Params,
  wasmFilename: "mp3.wasm" as const,
};
