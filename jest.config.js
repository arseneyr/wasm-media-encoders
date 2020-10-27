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

module.exports = {
  projects: [
    {
      ...common,
      displayName: "browser",
      testEnvironment: "jsdom",
      globals: { ...common.globals, __maybeNode__: false },
    },
    {
      ...common,
      displayName: "node",
      testEnvironment: "node",
      globals: { ...common.globals, __maybeNode__: true },
    },
  ],
};
