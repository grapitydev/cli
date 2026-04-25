import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outExtension: () => ({ js: ".js" }),
  dts: true,
  clean: true,
  splitting: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
});