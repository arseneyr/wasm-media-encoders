import { createReadStream, promises as fs } from "fs";
import { resolve } from "path";
import { createEncoder, WasmMediaEncoder } from "../encoder";

const wav = require("wav");

let wavData!: [Float32Array, Float32Array];
let encoder: WasmMediaEncoder<"audio/mpeg">;
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

  [encoder, wavData] = await Promise.all<typeof encoder, typeof wavData>([
    fs
      .readFile(resolve(__dirname, "../wasm/build/mp3.wasm"))
      .then((f) => createEncoder("audio/mpeg", f)),
    p.then((b) => {
      const pcm_l = new Float32Array(b.length / 2);
      const pcm_r = new Float32Array(b.length / 2);
      b.forEach(
        (s, i) => ((i & 1 ? pcm_r : pcm_l)[Math.floor(i / 2)] = s / 32768)
      );
      return [pcm_l, pcm_r];
    }),
  ]);
});

test.each([
  { vbrQuality: 0 },
  { vbrQuality: 5 },
  { cbrRate: 8 as const },
  { cbrRate: 128 as const },
])("mp3 %p", async (params) => {
  encoder.configure({
    channels: format.channels,
    sampleRate: format.sampleRate,
    ...params,
  });

  let outBuf = Buffer.from(encoder.encode(wavData));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  const refFile = await fs.readFile(
    resolve(
      __dirname,
      "test_mp3",
      (params.vbrQuality !== undefined
        ? `v_${params.vbrQuality}`
        : `c_${params.cbrRate}`) + ".mp3"
    )
  );
  expect(refFile.compare(outBuf)).toBe(0);
});

test.skip("vs c lame", async () => {
  encoder.configure({
    channels: format.channels,
    sampleRate: format.sampleRate,
    vbrQuality: 0,
  });

  let outBuf = Buffer.from(encoder.encode(wavData));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  const refFile = await fs.readFile(resolve(__dirname, "testcase.mp3"));
  await fs.writeFile(resolve(__dirname, "gen.mp3"), outBuf);
  expect(
    refFile.reduce((a, b, i) => a + (b !== outBuf[i] ? 1 : 0), 0)
  ).toBeLessThan(5);
  await fs.writeFile(resolve(__dirname, "test_mp3", "v_0.mp3"), outBuf);
});

test("invalid params", () => {
  expect(() =>
    encoder.configure({
      channels: format.channels,
      sampleRate: format.sampleRate,
      vbrQuality: 10,
    })
  ).toThrowError();
  expect(() =>
    encoder.configure({
      channels: format.channels,
      sampleRate: format.sampleRate,
      bitrate: 1 as any,
    })
  ).toThrowError();
});

test("mono encoding", async () => {
  encoder.configure({
    channels: 1,
    sampleRate: format.sampleRate,
  });
  let outBuf = Buffer.from(encoder.encode(wavData.slice(0, 1)));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  const refFile = await fs.readFile(resolve(__dirname, "test_mp3/mono.mp3"));
  expect(refFile.compare(outBuf)).toBe(0);
});
