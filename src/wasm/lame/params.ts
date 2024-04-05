import { XOR } from "../../utils";

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

type Mp3OutputSampleRates =
  | 8000
  | 11025
  | 12000
  | 16000
  | 22050
  | 24000
  | 32000
  | 44100
  | 48000;

type Mp3Params = XOR<{ bitrate?: Mp3CbrValues }, { vbrQuality?: number }> & {
  outputSampleRate?: Mp3OutputSampleRates;
};

function parseMp3Params(params: Mp3Params) {
  switch (params.bitrate) {
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
      throw new Error(
        `Invalid constant bitrate ${(params as Mp3Params).bitrate}`
      );
  }

  switch (params.outputSampleRate) {
    case undefined:
    case 8000:
    case 11025:
    case 12000:
    case 16000:
    case 22050:
    case 24000:
    case 32000:
    case 44100:
    case 48000:
      break;
    default:
      throw new Error(`Invalid output sample rate ${params.outputSampleRate}`);
  }

  if (params.vbrQuality !== undefined) {
    if (params.vbrQuality < 0 || params.vbrQuality >= 10) {
      throw new Error(`Invalid VBR quality: ${params.vbrQuality}`);
    }
  }

  const ret = new Int32Array(3);
  ret[0] = params.bitrate ?? 0;
  new Float32Array(ret.buffer)[1] =
    params.vbrQuality ?? (params.bitrate !== undefined ? -1 : 4);
  ret[2] = params.outputSampleRate ?? 0;

  return ret;
}

export const Mp3Params = {
  mimeType: "audio/mpeg" as const,
  parseParams: parseMp3Params,
};
