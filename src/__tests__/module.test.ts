import { describe, beforeAll, test, expect, vi } from "vitest";
import { promises as fs } from "fs";
import { resolve } from "path";
import { createEncoder, WasmMediaEncoder, jsLibraryVersion } from "../encoder";

describe.each([
  ["audio/mpeg" as const, "mp3.wasm"],
  ["audio/ogg" as const, "ogg.wasm"],
])("MIME %s", (mimeType, filename) => {
  let wasm: Buffer;
  beforeAll(async () => {
    wasm = await fs.readFile(resolve(__dirname, "../wasm/build", filename));
    fetchMock.dontMockIf(/data:application\/wasm;base64/, (url) => {
      if (url === "https://example.com/" + filename) {
        return new Response(wasm, {
          headers: { "Content-Type": "application/wasm" },
        });
      }
      throw new Error("Unknown request");
    });
  });

  test("Unsupported mimeType", async () => {
    await expect(
      createEncoder("video/mpeg" as any, wasm)
    ).rejects.toBeInstanceOf(Error);
  });

  test("fetch from data uri", async () => {
    const dataUri = "data:application/wasm;base64," + wasm.toString("base64");

    await expect(createEncoder(mimeType, dataUri)).resolves.toBeInstanceOf(
      WasmMediaEncoder
    );
  });

  test("fetch from unknown url", () => {
    return expect(
      createEncoder(mimeType, `https://example.com/`)
    ).rejects.toThrow(Error);
  });

  test("fetch from custom url", async () => {
    await expect(
      createEncoder(mimeType, `https://example.com/${filename}`)
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((fetch as any).mock.calls[0][0]).toMatch("example.com");
  });

  test("fetch without instantiateStreaming", async () => {
    delete (globalThis as any).WebAssembly.instantiateStreaming;
    await expect(
      createEncoder(mimeType, `https://example.com/${filename}`)
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((fetch as any).mock.calls[0][0]).toMatch("example.com");
  });

  test("use buffer", async () => {
    await expect(createEncoder(mimeType, wasm)).resolves.toBeInstanceOf(
      WasmMediaEncoder
    );
  });

  test("use precompiled module", async () => {
    const mockCallback = vi.fn();
    const module = await WebAssembly.compile(wasm);
    await expect(
      createEncoder(mimeType, await WebAssembly.compile(wasm), mockCallback)
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(mockCallback).toHaveBeenCalledWith(
      module,
      jsLibraryVersion(),
      mimeType
    );
  });

  test("compiled module callback", async () => {
    const mockCallback = vi.fn();
    await expect(
      createEncoder(mimeType, wasm, mockCallback)
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback.mock.calls[0][0]).toBeInstanceOf(WebAssembly.Module);
    expect(mockCallback.mock.calls[0][1]).toBe(jsLibraryVersion());
    expect(mockCallback.mock.calls[0][2]).toBe(mimeType);
  });

  test("incorrect encode array count", async () => {
    const encoder = await createEncoder(mimeType, wasm);
    expect(encoder).toBeInstanceOf(WasmMediaEncoder);
    encoder.configure({ sampleRate: 48000, channels: 2 });
    expect(() => encoder.encode([new Float32Array(1024)])).toThrow();
  });

  test("Buffer reallocation", async () => {
    const encoder = await createEncoder(mimeType, wasm);
    expect(encoder).toBeInstanceOf(WasmMediaEncoder);
    encoder.configure({ sampleRate: 48000, channels: 1 });

    // Emscripten initial memory size is 256 pages (64KiB each)
    expect(encoder.encode([new Float32Array(32 * 1024 * 256)])).toBeInstanceOf(
      Uint8Array
    );
  });
  test.skip("encode large white noise buffer", async () => {
    const input = Array.from({ length: 2 }, () =>
      Float32Array.from({ length: 10 * 1000 * 1000 }, () => Math.random())
    ) as [Float32Array, Float32Array];
    const encoder = await createEncoder(mimeType, wasm);
    encoder.configure({
      channels: 2,
      sampleRate: 48000,
    });
    const t0 = process.hrtime.bigint();
    expect(encoder.encode(input)).toBeInstanceOf(Uint8Array);
    console.log(
      `${mimeType} took ${(process.hrtime.bigint() - t0) / BigInt(1000000)}ms`
    );
  });
});

describe("fetch-less browser", () => {
  let wasm: Buffer;
  beforeAll(async () => {
    delete (globalThis as any).fetch;
    delete (globalThis as any).WebAssembly.instantiateStreaming;
    wasm = await fs.readFile(resolve(__dirname, "../wasm/build", "ogg.wasm"));
  });
  test("fetch from data uri", async () => {
    const dataUri = "data:application/wasm;base64," + wasm.toString("base64");

    await expect(createEncoder("audio/ogg", dataUri)).resolves.toBeInstanceOf(
      WasmMediaEncoder
    );
  });

  test("fetch from unknown url", () => {
    return expect(
      createEncoder("audio/ogg", `https://example.com/`)
    ).rejects.toThrow(Error);
  });
});
