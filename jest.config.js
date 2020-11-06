const common = {
  preset: "ts-jest/presets/js-with-ts",
  globals: {
    "ts-jest": {
      tsConfig: {
        allowJs: true,
        esModuleInterop: true,
      },
    },
  },
};

export default {
  projects: [
    {
      ...common,
      displayName: "browser",
      testEnvironment: "jsdom",
      globals: { ...common.globals, __maybeNode__: false },
      testPathIgnorePatterns: ["/node_modules/", ".node."],
    },
    {
      ...common,
      displayName: "node",
      testEnvironment: "node",
      globals: { ...common.globals, __maybeNode__: true },
      testPathIgnorePatterns: ["/node_modules/", ".browser."],
    },
  ],
};
