import { beforeAll, test, expect } from "@jest/globals";
import { createReadStream, promises as fs } from "fs";
import { resolve } from "path";
import { createEncoder, WasmMediaEncoder } from "../encoder";

const wav = require("wav");

let wavData: readonly Float32Array[];
let encoder: WasmMediaEncoder<"audio/ogg">;
let format: any;

beforeAll(async () => {
  let onDone: (b: Int16Array) => void;
  const buf: Buffer[] = [];
  let p = new Promise<Int16Array>((res) => (onDone = res));

  const reader = new wav.Reader();

  reader.on("data", (data: Buffer) => {
    buf.push(data);
  });

  reader.on("format", (data: any) => {
    format = data;
  });

  reader.on("end", () => {
    onDone(new Int16Array(Buffer.concat(buf).buffer));
  });

  createReadStream(
    resolve(__dirname, "../wasm/lame/lame-src/testcase.wav")
  ).pipe(reader);

  [encoder, wavData] = await Promise.all([
    fs
      .readFile(resolve(__dirname, "../wasm/build/ogg.wasm"))
      .then((f) => createEncoder("audio/ogg", f)),
    p.then((b) => {
      const pcm_l = new Float32Array(b.length / 2);
      const pcm_r = new Float32Array(b.length / 2);
      b.forEach(
        (s, i) => ((i & 1 ? pcm_r : pcm_l)[Math.floor(i / 2)] = s / 32768)
      );
      return [pcm_l, pcm_r] as const;
    }),
  ]);
});

test.each([{ vbrQuality: 3 }])("ogg %p", async (params) => {
  encoder.configure({
    channels: format.channels,
    sampleRate: format.sampleRate,
    oggSerialNo: 0,
    ...params,
  });

  let outBuf = Buffer.from(encoder.encode(wavData));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  expect(outBuf).toMatchSnapshot();
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
  let outBuf = Buffer.from(encoder.encode(wavData.slice(0, 1)));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  expect(outBuf).toMatchSnapshot();
});
