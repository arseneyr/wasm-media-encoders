import { promises as fs } from "fs";
import { resolve } from "path";
import { createEncoder, WasmMediaEncoder } from "../encoder";

describe.each([
  ["audio/mpeg" as const, "mp3.wasm"],
  ["audio/ogg" as const, "ogg.wasm"],
])("MIME %s", (mimeType, filename) => {
  let wasm: Buffer;
  beforeAll(async () => {
    wasm = await fs.readFile(resolve(__dirname, "../wasm/build", filename));
  });

  test("Unsupported mimeType", async () => {
    await expect(
      createEncoder("video/mpeg" as any, undefined as any)
    ).rejects.toBeInstanceOf(Error);
  });

  test("fetch from custom url", async () => {
    await expect(
      createEncoder(mimeType, `https://example.com/${filename}`)
    ).rejects.toBeInstanceOf(Error);
  });

  test("fetch from data uri", async () => {
    const dataUri = "data:application/wasm;base64," + wasm.toString("base64");

    await expect(createEncoder(mimeType, dataUri)).resolves.toBeInstanceOf(
      WasmMediaEncoder
    );
  });

  test("use buffer", async () => {
    await expect(createEncoder(mimeType, wasm)).resolves.toBeInstanceOf(
      WasmMediaEncoder
    );
  });

  test("use precompiled module", async () => {
    const mockCallback = jest.fn();
    const module = await WebAssembly.compile(wasm);
    await expect(
      createEncoder(mimeType, await WebAssembly.compile(wasm), mockCallback)
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(mockCallback).toHaveBeenCalledWith(module);
  });

  test("compiled module callback", async () => {
    const mockCallback = jest.fn();
    await expect(
      createEncoder(mimeType, wasm, mockCallback)
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback.mock.calls[0][0]).toBeInstanceOf(WebAssembly.Module);
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
  test("encode large white noise", async () => {
    const input = Array.from({ length: 2 }, () =>
      Float32Array.from({ length: 48000 * 100 }, () => Math.random())
    );
    const encoder = await createEncoder(mimeType, wasm);
    encoder.configure({
      channels: 2,
      sampleRate: 48000,
    });
    const t0 = process.hrtime.bigint();
    expect(encoder.encode(input)).toBeInstanceOf(Uint8Array);
    console.log(
      `${mimeType} took ${(process.hrtime.bigint() - t0) / 1000000n}ms`
    );
  });
});
