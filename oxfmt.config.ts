import { defineConfig } from "oxfmt"

export default defineConfig({
  ignorePatterns: [
    "pnpm-lock.yaml",
    "**/route.gen.ts",
    "config/",
    "packages/e2e/.config/",
    "packages/e2e/test-results/",
    "packages/e2e/playwright-report/",
  ],
  printWidth: 80,
  semi: false,
  sortPackageJson: false,
  sortTailwindcss: {
    stylesheet: "packages/web/src/index.css",
    functions: ["clsx", "twMerge"],
  },
  sortImports: {
    newlinesBetween: false,
    internalPattern: ["@razzia/"],
    groups: [
      "type-import",
      ["value-builtin", "value-external"],
      "type-internal",
      "value-internal",
      ["type-parent", "type-sibling", "type-index"],
      ["value-parent", "value-sibling", "value-index"],
      "unknown",
    ],
  },
})
