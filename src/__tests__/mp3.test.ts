import { createReadStream, promises as fs } from "fs";
import { resolve } from "path";
import { createEncoder, WasmMediaEncoder } from "../encoder";

const wav = require("wav");

let wavData: readonly [Float32Array, Float32Array];
let encoder: WasmMediaEncoder<"audio/mpeg", (typeof wavData)["length"]>;
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
      .readFile(resolve(__dirname, "../wasm/build/mp3.wasm"))
      .then((f) => createEncoder("audio/mpeg", f)),
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

test.each([
  { vbrQuality: 0 },
  { vbrQuality: 5 },
  { bitrate: 8 as const },
  { bitrate: 128 as const },
  { outputSampleRate: 44100 as const },
  { outputSampleRate: 8000 as const },
])("mp3 %p", async (params) => {
  encoder.configure({
    channels: format.channels,
    sampleRate: format.sampleRate,
    ...params,
  });

  let outBuf = Buffer.from(encoder.encode(wavData));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  expect(outBuf).toMatchSnapshot();
});

test.skip("vs c lame", async () => {
  encoder.configure({
    channels: format.channels,
    sampleRate: format.sampleRate,
    bitrate: 128,
  });

  let outBuf = Buffer.from(encoder.encode(wavData));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  const refFile = await fs.readFile(resolve(__dirname, "testcase.mp3"));
  await fs.writeFile(resolve(__dirname, "gen.mp3"), outBuf);
  expect(refFile.reduce((a, b, i) => a + (b !== outBuf[i] ? 1 : 0), 0)).toBe(0);
  await fs.writeFile(resolve(__dirname, "test_refs", "c_128.mp3"), outBuf);
});

test("invalid params", () => {
  expect(() =>
    encoder.configure({
      channels: format.channels,
      sampleRate: format.sampleRate,
      vbrQuality: 10,
    })
  ).toThrow();
  expect(() =>
    encoder.configure({
      channels: format.channels,
      sampleRate: format.sampleRate,
      bitrate: 1 as any,
    })
  ).toThrow();
  expect(() =>
    encoder.configure({
      channels: format.channels,
      sampleRate: format.sampleRate,
      outputSampleRate: 5 as any,
    })
  ).toThrow(Error);
});

test("mono encoding", async () => {
  let monoEncoder = encoder as WasmMediaEncoder<"audio/ogg", 1>;
  encoder.configure({
    channels: 1,
    sampleRate: format.sampleRate,
  });
  let outBuf = Buffer.from(encoder.encode(wavData.slice(0, 1)));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  expect(outBuf).toMatchSnapshot();
});
