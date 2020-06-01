const common = {
  preset: "ts-jest/presets/js-with-ts",
  globals: {
    "ts-jest": {
      tsConfig: {
        allowJs: true,
      },
      diagnostics: {
        ignoreCodes: [151001],
      },
    },
  },
};

module.exports = {
  projects: [
    { ...common, displayName: "browser", testEnvironment: "jsdom" },
    { ...common, displayName: "node", testEnvironment: "node" },
  ],
};
