import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same mapping as tsconfig's "@/*" so tests import app code by alias.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
