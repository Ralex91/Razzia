import { fileURLToPath } from "url"
import { defineConfig } from "vitest/config"

const alias = {
  "@razzia/common": fileURLToPath(
    new URL("./packages/common/src", import.meta.url),
  ),
  "@razzia/socket": fileURLToPath(
    new URL("./packages/socket/src", import.meta.url),
  ),
  "@razzia/web": fileURLToPath(new URL("./packages/web/src", import.meta.url)),
}

export default defineConfig({
  resolve: { alias },
  test: {
    coverage: {
      include: ["packages/{common,socket,web}/src/**/*.{ts,tsx}"],
      exclude: ["**/*.test.ts", "**/test/**", "**/route.gen.ts"],
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: "common",
          include: ["packages/common/src/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "socket",
          include: ["packages/socket/src/**/*.test.ts"],
          setupFiles: ["packages/socket/src/test/setup.ts"],
          env: {
            MANAGER_PASSWORD: "test-password",
            JWT_SECRET: "test-secret-that-is-at-least-32-characters",
          },
        },
      },
      {
        resolve: { alias },
        test: {
          name: "web",
          include: ["packages/web/src/**/*.test.ts"],
        },
      },
    ],
  },
})
