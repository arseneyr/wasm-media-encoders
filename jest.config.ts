import type { Config } from "jest";

const config: Config = {
  transform: {
    "^.+\\.[tj]s$": [
      "ts-jest",
      {
        // tsconfig: {
        //   allowJs: true,
        // },
      },
    ],
  },
  testEnvironment: "node",
  setupFiles: ["<rootDir>/src/__tests__/fetchMock.ts"],
  testRegex: "/__tests__/.*\\.test\\.ts$",
  clearMocks: true,
};

export default config;
