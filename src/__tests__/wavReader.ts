import { Readable } from "node:stream";
import { Format, Reader as WavReader } from "wav";

function readWavFile(
  inputStream: Readable
): Promise<{ buffer: Int16Array; format: Format }> {
  return new Promise((res) => {
    const reader = new WavReader();
    let buf: Buffer[] = [];
    let format: Format;

    reader.on("data", (data: Buffer) => {
      buf.push(data);
    });

    reader.on("format", (data) => {
      format = data;
    });

    reader.on("end", () => {
      res({ buffer: new Int16Array(Buffer.concat(buf).buffer), format });
    });

    inputStream.pipe(reader);
  });
}

function interleavedPcm16ToFloat(buffer: Int16Array) {
  const pcm_l = new Float32Array(buffer.length / 2);
  const pcm_r = new Float32Array(buffer.length / 2);
  buffer.forEach(
    (s, i) => ((i & 1 ? pcm_r : pcm_l)[Math.floor(i / 2)] = s / 32768)
  );
  return [pcm_l, pcm_r] as const;
}

export { readWavFile, interleavedPcm16ToFloat };
