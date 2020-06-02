import { createEncoder, WasmEncoder } from "../../dist/bundle/mp3";

test("Loading bundle works", async () => {
  await expect(createEncoder()).resolves.toBeInstanceOf(WasmEncoder);
});
