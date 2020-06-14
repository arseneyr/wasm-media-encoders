import OggModule from "../build/ogg";

const MIN_INT = -2147483648;
const MAX_INT = 2147483647;

function getRandomInt() {
  return Math.floor(Math.random() * (MAX_INT - MIN_INT + 1)) + MIN_INT;
}

interface OggParams {
  vbrQuality?: number;
  oggSerialNo?: number;
}

function parseOggParams(params: OggParams) {
  const vbrQuality = params.vbrQuality ?? 3;
  const oggSerialNo =
    params.oggSerialNo !== undefined
      ? Math.min(Math.max(Math.floor(params.oggSerialNo), MIN_INT), MAX_INT)
      : getRandomInt();

  if (vbrQuality < -1 || vbrQuality > 10) {
    throw new Error(`Invalid VBR quality ${vbrQuality}`);
  }

  const ret = new Int32Array(2);
  new Float32Array(ret.buffer)[0] = vbrQuality;
  ret[1] = oggSerialNo;
  return ret;
}

export const OggParams = {
  mimeType: "audio/ogg" as const,
  parseParams: parseOggParams,
  module: OggModule,
};
