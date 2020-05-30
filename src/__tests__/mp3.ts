import { enableFetchMocks } from "jest-fetch-mock";
import { promises } from "fs";
import { resolve } from "path";
import Encoder from "../encoder";
const pkg = require("../../package.json");

enableFetchMocks();

const wasm: { [filename: string]: ArrayBuffer } = {};

beforeAll(async () => {
  await Promise.all(
    ["mp3.wasm"].map(async (filename) => {
      wasm[filename] = (
        await promises.readFile(resolve(__dirname, "../wasm/build", filename))
      ).buffer;
    })
  );
});

test("Unsupported mimeType", () => {
  expect(() => {
    //@ts-ignore
    new Encoder("video/mpeg");
  }).toThrowError();
});

describe("fetching from unpkg", () => {
  beforeAll(() => {
    fetchMock.mockResponse(async (req) => {
      const [filename, data] =
        Object.entries(wasm).find(
          ([filename]) =>
            req.url ===
            `https://unpkg.com/${pkg.name}@${pkg.version}/wasm/` + filename
        ) ?? [];
      if (!filename) {
        throw new Error("Unknown request");
      }
      return (await new Response(data)) as any;
    });
  });

  afterAll(() => {
    fetchMock.resetMocks();
  });

  test("basic init", async () => {
    await expect(new Encoder("audio/mpeg").init()).resolves.toBeUndefined();
    expect(fetchMock.mock.calls).toEqual([
      [`https://unpkg.com/wasm-encoders@${pkg.version}/wasm/mp3.wasm`],
    ]);
  });
});
