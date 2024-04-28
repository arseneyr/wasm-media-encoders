import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/src/__tests__/fetchMock.ts"],
  testRegex: "/__tests__/.*\\.test\\.ts$",
  clearMocks: true,
};

export default config;
