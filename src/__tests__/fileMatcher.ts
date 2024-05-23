import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { expect } from "vitest";

interface CustomMatchers<R = unknown> {
  toMatchFile: (filepath: string) => R;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toMatchFile(received: Buffer, filename: string) {
    const { snapshotState, equals, isNot } = this;
    if (isNot) {
      throw new Error(".toMatchFile does not support .not");
    }
    const snapshotsDir = resolve(__dirname, "__snapshots__");
    const expectedSnapshotPath = resolve(snapshotsDir, filename);
    const hasExpected = existsSync(expectedSnapshotPath);
    const updateSnapshot = snapshotState["_updateSnapshot"];
    if (
      updateSnapshot === "all" ||
      (!hasExpected && updateSnapshot === "new")
    ) {
      writeFileSync(expectedSnapshotPath, received);
      return {
        pass: true,
        message: () => "",
      };
    }

    const expected = readFileSync(expectedSnapshotPath);

    return {
      pass: equals(received, expected),
      message: () => `expected buffer to equal contents of ${filename}`,
    };
  },
});
