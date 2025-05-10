import { beforeAll, test, expect } from "vitest";
import { createReadStream, promises as fs } from "fs";
import { resolve } from "path";
import { createEncoder, WasmMediaEncoder } from "../encoder";
import { interleavedPcm16ToFloat, readWavFile } from "./wavReader";
import { Format } from "wav";

type StereoFormat = Format & { channels: 2 };

const TABLE_OF_CONTENTS_SIZE_BYTES = 100;

let wavData: readonly Float32Array[];
let smallWavData: readonly Float32Array[];
let encoder: WasmMediaEncoder<"audio/mpeg">;
let format: StereoFormat;

function assertChannelCount(format: Format): asserts format is StereoFormat {
  if (format.channels > 2) {
    throw new Error("too many channels");
  }
}

function getLameHeader(buffer: Buffer): {
  frameCount?: number;
  tableOfContents?: Buffer;
  headerType?: "Xing" | "Info";
} {
  const result: {
    frameCount?: number;
    tableOfContents?: Buffer;
    headerType?: "Xing" | "Info";
  } = {};

  for (let i = 0; i < buffer.length; i++) {
    const fieldName: string = buffer.slice(i, i + 4).toString("utf8");
    const isVbrMarker = fieldName === "Xing";
    const isCbrMarker = fieldName === "Info";

    if (isVbrMarker || isCbrMarker) {
      const headerStart = i;
      const flags = buffer.readUInt32BE(headerStart + 4);
      let offset = 8;

      result.headerType = fieldName;

      if (flags & 0x00000001) {
        result.frameCount = buffer.readUInt32BE(headerStart + offset);
        offset += 4;
      }

      if (flags & 0x00000002) {
        if (
          headerStart + offset + TABLE_OF_CONTENTS_SIZE_BYTES <=
          buffer.length
        ) {
          result.tableOfContents = Buffer.alloc(TABLE_OF_CONTENTS_SIZE_BYTES);
          buffer.copy(
            result.tableOfContents,
            0,
            headerStart + offset,
            headerStart + offset + TABLE_OF_CONTENTS_SIZE_BYTES
          );
        }
        offset += TABLE_OF_CONTENTS_SIZE_BYTES;
      }

      break;
    }
  }

  return result;
}

beforeAll(async () => {
  [encoder, [wavData, format]] = await Promise.all([
    fs
      .readFile(resolve(__dirname, "../wasm/build/mp3.wasm"))
      .then((f) => createEncoder("audio/mpeg", f)),
    readWavFile(createReadStream(resolve(__dirname, "test.wav"))).then(
      ({ buffer, format }) => {
        assertChannelCount(format);
        return [interleavedPcm16ToFloat(buffer), format] as const;
      }
    ),
  ]);
  smallWavData = wavData.map((a) => a.subarray(0, 1 * format.sampleRate));
});

test.each([
  { vbrQuality: 0 },
  { vbrQuality: 5 },
  { bitrate: 8 as const },
  { bitrate: 128 as const },
  { outputSampleRate: 44100 as const },
  { outputSampleRate: 8000 as const },
])("mp3 %p", (params) => {
  encoder.configure({
    ...format,
    ...params,
  });

  let outBuf = Buffer.from(encoder.encode(smallWavData));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  const [key, value] = Object.entries(params)[0];
  const filename = `test_${key}_${value}.mp3`;
  expect(outBuf).toMatchFile(filename);
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

test("large buffer encoding", () => {
  encoder.configure({
    channels: format.channels,
    sampleRate: format.sampleRate,
    bitrate: 48,
  });
  let outBuf = Buffer.from(encoder.encode(wavData));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  expect(outBuf).toMatchFile("large.mp3");
});

test("mono encoding", () => {
  encoder.configure({
    channels: 1,
    sampleRate: format.sampleRate,
  });
  let outBuf = Buffer.from(encoder.encode(smallWavData.slice(0, 1)));
  outBuf = Buffer.concat([outBuf, encoder.finalize()]);
  expect(outBuf).toMatchFile("mono.mp3");
});

test("cbr header encoding", () => {
  encoder.configure({
    channels: format.channels,
    sampleRate: format.sampleRate,
    bitrate: 128,
  });
  encoder.encode(smallWavData);
  encoder.finalize();
  let headerBuf = Buffer.from(encoder.getHeaders());

  const headerInfo = getLameHeader(headerBuf);

  expect(headerInfo.headerType).toBe("Info");
  expect(headerInfo.frameCount).toBeDefined();
  expect(headerInfo.frameCount).toBeGreaterThan(0);
  expect(headerInfo.tableOfContents).toBeDefined();
});

test("vbr header encoding", () => {
  encoder.configure({
    channels: format.channels,
    sampleRate: format.sampleRate,
    vbrQuality: 5,
  });
  encoder.encode(smallWavData);
  encoder.finalize();
  let headerBuf = Buffer.from(encoder.getHeaders());

  const headerInfo = getLameHeader(headerBuf);

  expect(headerInfo.headerType).toBe("Xing");
  expect(headerInfo.frameCount).toBeDefined();
  expect(headerInfo.frameCount).toBeGreaterThan(0);
  expect(headerInfo.tableOfContents).toBeDefined();
});
