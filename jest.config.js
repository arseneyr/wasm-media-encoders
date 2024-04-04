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
      testRegex: "/__tests__/.*(browser|common)\\.ts$",
    },
    {
      ...common,
      displayName: "node",
      testEnvironment: "node",
      globals: { ...common.globals, __maybeNode__: true },
      testRegex: "/__tests__/.*(node|common)\\.ts$",
    },
  ],
};
