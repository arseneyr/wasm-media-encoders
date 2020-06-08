import {
  createEncoder as createMp3Encoder,
  WasmMediaEncoder as Mp3Encoder,
} from "../../dist/bundle/mp3";
import { createEncoder, WasmMediaEncoder } from "../../dist/bundle";

test("Loading bundle works", async () => {
  await expect(createMp3Encoder()).resolves.toBeInstanceOf(Mp3Encoder);
  await expect(createEncoder("audio/mpeg")).resolves.toBeInstanceOf(
    WasmMediaEncoder
  );
  await expect(createEncoder("INVALID" as any)).rejects.toBeInstanceOf(Error);
});
