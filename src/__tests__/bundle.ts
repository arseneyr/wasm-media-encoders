import {
  createEncoder as createMp3Encoder,
  WasmEncoder as Mp3Encoder,
} from "../../dist/bundle/mp3";
import { createEncoder, WasmEncoder } from "../../dist/bundle";

test("Loading bundle works", async () => {
  await expect(createMp3Encoder()).resolves.toBeInstanceOf(Mp3Encoder);
  await expect(createEncoder("audio/mpeg")).resolves.toBeInstanceOf(
    WasmEncoder
  );
  await expect(createEncoder("INVALID" as any)).rejects.toBeInstanceOf(Error);
});
