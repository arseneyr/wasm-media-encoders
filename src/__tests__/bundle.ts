import { createEncoder, WasmMediaEncoder } from "../../dist";

test("Loading bundle works", async () => {
  await expect(createEncoder("audio/mpeg")).resolves.toBeInstanceOf(
    WasmMediaEncoder
  );
  await expect(createEncoder("INVALID" as any)).rejects.toBeInstanceOf(Error);
});
