import Mp3Encoder from "../../dist/bundle/mp3";

test("Loading bundle works", async () => {
  await expect(new Mp3Encoder().init()).resolves.toBeInstanceOf(Mp3Encoder);
});
