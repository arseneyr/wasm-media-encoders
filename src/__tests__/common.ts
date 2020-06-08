import { enableFetchMocks } from "jest-fetch-mock";
import { promises as fs } from "fs";
import { resolve } from "path";
import { createEncoder, WasmMediaEncoder } from "../encoder";
const pkg = require("../../package.json");

enableFetchMocks();

const wasm: { [filename: string]: Buffer } = {};

beforeAll(async () => {
  await Promise.all(
    ["mp3.wasm"].map(async (filename) => {
      wasm[filename] = await fs.readFile(
        resolve(__dirname, "../wasm/build", filename)
      );
    })
  );
});

test("Unsupported mimeType", async () => {
  await expect(createEncoder("video/mpeg" as any)).rejects.toBeInstanceOf(
    Error
  );
});

describe("fetching from url", () => {
  beforeEach(() => {
    fetchMock.mockResponse(async (req) => {
      const [filename, data] =
        Object.entries(wasm).find(
          ([filename]) =>
            req.url ===
              `https://unpkg.com/${pkg.name}@${pkg.version}/wasm/` + filename ||
            req.url === "https://example.com/" + filename
        ) ?? [];
      if (!filename) {
        throw new Error("Unknown request");
      }
      return (await new Response(data)) as any;
    });
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  test("fetch from unpkg", async () => {
    await expect(createEncoder("audio/mpeg")).resolves.toBeInstanceOf(
      WasmMediaEncoder
    );
    expect(fetchMock.mock.calls[0][0]).toMatch("unpkg.com");
  });

  test("fetch from custom url", async () => {
    await expect(
      createEncoder("audio/mpeg", "https://example.com/mp3.wasm")
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(fetchMock.mock.calls[0][0]).toMatch("example.com");
  });

  test("fetch from data uri", async () => {
    const dataUri =
      "data:application/wasm;base64," + wasm["mp3.wasm"].toString("base64");

    await expect(createEncoder("audio/mpeg", dataUri)).resolves.toBeInstanceOf(
      WasmMediaEncoder
    );
    expect(fetchMock.mock.calls).toHaveLength(0);
  });

  test("use buffer", async () => {
    await expect(
      createEncoder("audio/mpeg", wasm["mp3.wasm"])
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(fetchMock.mock.calls).toHaveLength(0);
  });

  test("use precompiled module", async () => {
    await expect(
      createEncoder("audio/mpeg", await WebAssembly.compile(wasm["mp3.wasm"]))
    ).resolves.toBeInstanceOf(WasmMediaEncoder);
    expect(fetchMock.mock.calls).toHaveLength(0);
  });
});
