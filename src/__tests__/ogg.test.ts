import { beforeAll, test, expect } from "vitest";
import { createReadStream, promises as fs } from "fs";
import { resolve } from "path";
import { createEncoder, WasmMediaEncoder } from "../encoder";
import { interleavedPcm16ToFloat, readWavFile } from "./wavReader";

let wavData: readonly Float32Array[];
let smallWavData: readonly Float32Array[];
let encoder: WasmMediaEncoder<"audio/ogg">;
let format: any;

beforeAll(async () => {
  [encoder, [wavData, format]] = await Promise.all([
    fs
      .readFile(resolve(__dirname, "../wasm/build/ogg.wasm"))
      .then((f) => createEncoder("audio/ogg", f)),
    readWavFile(createReadStream(resolve(__dirname, "test.wav"))).then(
      ({ buffer, format }) => {
        return [interleavedPcm16ToFloat(buffer), format] as const;
      }
    ),
  ]);
  smallWavData = wavData.map((a) =>
    a.subarray(30 * format.sampleRate, 31 * format.sampleRate)
  );
});

test.each([{ vbrQuality: 3 }])("ogg %p", async (params) => {
  encoder.configure({
    channels: format.channels,
    sampleRate: format.sampleRate,
    oggSerialNo: 0,
    ...params,
  });

  let outBuf = Buffer.from(encoder.encode(smallWavData));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  const [key, value] = Object.entries(params)[0];
  const filename = `test_${key}_${value}.ogg`;
  expect(outBuf).toMatchFile(filename);
});

test.skip("vs c vorbis", async () => {
  encoder.configure({
    channels: format.channels,
    sampleRate: format.sampleRate,
    vbrQuality: 3,
    oggSerialNo: 0,
  });

  let outBuf = Buffer.from(encoder.encode(wavData));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  await fs.writeFile(resolve(__dirname, "gen.ogg"), outBuf);
});

test("invalid params", () => {
  expect(() =>
    encoder.configure({
      channels: format.channels,
      sampleRate: format.sampleRate,
      vbrQuality: 12,
    })
  ).toThrowError();
});

test("mono encoding", async () => {
  encoder.configure({
    channels: 1,
    sampleRate: format.sampleRate,
    oggSerialNo: 0,
  });
  let outBuf = Buffer.from(encoder.encode(smallWavData.slice(0, 1)));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  expect(outBuf).toMatchFile("mono.ogg");
});
