import { createReadStream, promises as fs } from "fs";
import { resolve } from "path";
import WasmEncoder from "../encoder";

const wav = require("wav");

let wavFile!: Int16Array;
let encoder: WasmEncoder<"audio/mpeg">;
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

  [encoder, wavFile] = await Promise.all<typeof encoder, Int16Array>([
    new WasmEncoder(
      "audio/mpeg",
      await fs.readFile(resolve(__dirname, "../wasm/build/mp3.wasm"))
    ).init(),
    p,
  ]);
});

test("yo", async () => {
  const pcm_l = new Float32Array(wavFile.length / 2);
  const pcm_r = new Float32Array(wavFile.length / 2);
  wavFile.forEach(
    (s, i) => ((i & 1 ? pcm_r : pcm_l)[Math.floor(i / 2)] = s / 32768)
  );
  encoder.prepare({
    channels: format.channels,
    sampleRate: format.sampleRate,
    sampleCount: wavFile.length / 2,
  });
  // shouldnt work??
  const outBuf = Buffer.concat([
    encoder.encode([pcm_l, pcm_r]),
    encoder.finalize(),
  ]);
});
