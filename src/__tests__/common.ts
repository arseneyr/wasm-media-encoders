import { enableFetchMocks } from "jest-fetch-mock";
import { promises as fs } from "fs";
import { resolve } from "path";
import { createEncoder, WasmMediaEncoder } from "../encoder";

enableFetchMocks();

describe.each([
  ["audio/mpeg" as const, "mp3.wasm"],
  ["audio/ogg" as const, "ogg.wasm"],
])("MIME %s", (mimeType, filename) => {
  let wasm: Buffer;
  beforeAll(async () => {
    wasm = await fs.readFile(resolve(__dirname, "../wasm/build", filename));
  });

  test("Unsupported mimeType", async () => {
    await expect(createEncoder("video/mpeg" as any, "")).rejects.toBeInstanceOf(
      Error
    );
  });

  describe("fetching from url", () => {
    beforeEach(() => {
      fetchMock.mockResponse(async (req) => {
        if (req.url !== "https://example.com/" + filename) {
          throw new Error("Unknown request");
        }
        return (await new Response(wasm)) as any;
      });
    });

    afterEach(() => {
      fetchMock.resetMocks();
    });

    test("fetch from custom url", async () => {
      await expect(
        createEncoder(mimeType, `https://example.com/${filename}`)
      ).resolves.toBeInstanceOf(WasmMediaEncoder);
      expect(fetchMock.mock.calls[0][0]).toMatch("example.com");
    });

    test("fetch from data uri", async () => {
      const dataUri = "data:application/wasm;base64," + wasm.toString("base64");

      await expect(createEncoder(mimeType, dataUri)).resolves.toBeInstanceOf(
        WasmMediaEncoder
      );
      expect(fetchMock.mock.calls).toHaveLength(0);
    });

    test("use buffer", async () => {
      await expect(createEncoder(mimeType, wasm)).resolves.toBeInstanceOf(
        WasmMediaEncoder
      );
      expect(fetchMock.mock.calls).toHaveLength(0);
    });

    test("use precompiled module", async () => {
      await expect(
        createEncoder(mimeType, await WebAssembly.compile(wasm))
      ).resolves.toBeInstanceOf(WasmMediaEncoder);
      expect(fetchMock.mock.calls).toHaveLength(0);
    });
  });
});
