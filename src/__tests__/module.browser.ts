import { promises as fs } from "fs";
import { resolve } from "path";
import { createEncoder, WasmMediaEncoder } from "../encoder";
import { enableFetchMocks } from "jest-fetch-mock";
import { version as packageVersion } from "../../package.json";

enableFetchMocks();

describe.each([
  ["audio/mpeg" as const, "mp3.wasm"],
  ["audio/ogg" as const, "ogg.wasm"],
])("MIME %s", (mimeType, filename) => {
  let wasm: Buffer;
  beforeAll(async () => {
    wasm = await fs.readFile(resolve(__dirname, "../wasm/build", filename));
  });
  beforeEach(() => {
    fetchMock?.dontMockIf(/data:application\/wasm;base64/, async (req) => {
      if (req.url === "https://example.com/" + filename) {
        return (await new Response(wasm)) as any;
      }
      if (req.url) throw new Error("Unknown request");
    });
  });

  afterEach(() => {
    fetchMock?.resetMocks();
  });

  test("Unsupported mimeType", async () => {
    await expect(
      createEncoder("video/mpeg" as any, undefined as any)
    ).rejects.toBeInstanceOf(Error);
  });

  test("fetch from custom url", async () => {
    await expect(
      createEncoder(mimeType, `https://example.com/${filename}`)
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch("example.com");
  });

  test("fetch from data uri", async () => {
    const dataUri = "data:application/wasm;base64," + wasm.toString("base64");

    await expect(createEncoder(mimeType, dataUri)).resolves.toBeInstanceOf(
      WasmMediaEncoder
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toEqual(dataUri);
  });

  test("use buffer", async () => {
    await expect(createEncoder(mimeType, wasm)).resolves.toBeInstanceOf(
      WasmMediaEncoder
    );
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  test("use precompiled module", async () => {
    const mockCallback = jest.fn();
    const module = await WebAssembly.compile(wasm);
    await expect(
      createEncoder(mimeType, await WebAssembly.compile(wasm), mockCallback)
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(mockCallback).toHaveBeenCalledWith(module, packageVersion);
  });

  test("compiled module callback", async () => {
    const mockCallback = jest.fn();
    await expect(
      createEncoder(mimeType, wasm, mockCallback)
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback.mock.calls[0][0]).toBeInstanceOf(WebAssembly.Module);
    expect(mockCallback.mock.calls[0][1]).toBe(packageVersion);
  });

  test("Buffer reallocation", async () => {
    const encoder = await createEncoder(mimeType, wasm);
    expect(encoder).toBeInstanceOf(WasmMediaEncoder);
    encoder.configure({ sampleRate: 48000, channels: 1 });

    // Emscripten initial memory size is 256 pages (64KiB each)
    expect(encoder.encode([new Float32Array(16 * 1024 * 256)])).toBeInstanceOf(
      Uint8Array
    );
  });
});
