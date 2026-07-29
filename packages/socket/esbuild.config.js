import esbuild from "esbuild"

export const config = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: true,
  platform: "node",
  format: "cjs",
  outfile: "dist/index.cjs",
  sourcemap: true,
  // Native / optional deps must not be bundled.
  external: ["better-sqlite3", "fastify"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
}

await esbuild.build(config)
