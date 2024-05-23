import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["src/__tests__/fetchMock.ts", "src/__tests__/fileMatcher.ts"],
    include: ["src/__tests__/*.test.ts"],
    clearMocks: true,
    cache: {
      dir: ".vite",
    },
  },
});
