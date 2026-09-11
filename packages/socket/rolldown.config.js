import { defineConfig } from "rolldown"

export default defineConfig({
  input: "src/index.ts",
  platform: "node",
  transform: {
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  },
  output: {
    file: "dist/index.cjs",
    format: "cjs",
    minify: true,
    sourcemap: true,
  },
})
