const common = {
  preset: "ts-jest/presets/js-with-ts",
  globals: {
    "ts-jest": {
      tsConfig: {
        allowJs: true,
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
