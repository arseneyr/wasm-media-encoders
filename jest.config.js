const common = {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
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
