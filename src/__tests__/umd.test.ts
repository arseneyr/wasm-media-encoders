import { beforeAll, test, expect, describe, beforeEach } from "vitest";
import WasmMediaEncoder from "../../dist/umd/WasmMediaEncoder.min";
import { promises as fs } from "fs";
import { resolve } from "path";
import { name, version } from "../../package.json";

const wasm: { [filename: string]: Buffer } = {};

beforeAll(async () => {
  await Promise.all(
    ["mp3.wasm", "ogg.wasm"].map(async (filename) => {
      wasm[filename] = await fs.readFile(
        resolve(__dirname, "../wasm/build", filename)
      );
    })
  );
});

describe("fetching from url", () => {
  beforeEach(() => {
    fetchMock.mockResponse(async (req) => {
      const [filename, data] =
        Object.entries(wasm).find(
          ([filename]) =>
            req.url ===
              `https://unpkg.com/${name}@${version}/wasm/` + filename ||
            req.url === "https://example.com/" + filename
        ) ?? [];
      if (!filename) {
        throw new Error("Unknown request");
      }
      return (await new Response(data, {
        headers: { "Content-Type": "application/wasm" },
      })) as any;
    });
  });

  test("fetch from unpkg", async () => {
    await expect(WasmMediaEncoder.createMp3Encoder()).resolves.toBeInstanceOf(
      WasmMediaEncoder
    );
    await expect(WasmMediaEncoder.createOggEncoder()).resolves.toBeInstanceOf(
      WasmMediaEncoder
    );
    expect(fetchMock.mock.calls[0][0]).toMatch("unpkg.com");
    expect(fetchMock.mock.calls[1][0]).toMatch("unpkg.com");
  });
});
