import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import fs from "node:fs"
import type { IncomingMessage, ServerResponse } from "node:http"
import path from "node:path"
import { fileURLToPath } from "url"
import { defineConfig, type Plugin } from "vite"
import { ACCEPTED_MEDIA_TYPES } from "../common/src/constants"
import { version } from "../../package.json" with { type: "json" }

const configDir = (name: string) =>
  fileURLToPath(new URL(`../../config/${name}`, import.meta.url))

const brandingMimeTypes: Record<string, string> = {
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".css": "text/css",
  ".woff2": "font/woff2",
}

const mediaMimeTypes: Record<string, string> = Object.fromEntries(
  Object.entries(ACCEPTED_MEDIA_TYPES).map(([mime, { ext }]) => [ext, mime]),
)

const serveDir =
  (prefix: string, dir: string, mimeTypes: Record<string, string>) =>
  (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    if (!req.url?.startsWith(prefix)) {
      next()

      return
    }

    const [relative] = req.url.slice(prefix.length).split("?")
    const filePath = path.join(dir, relative)

    if (!filePath.startsWith(dir) || !fs.existsSync(filePath)) {
      res.statusCode = 404
      res.end()

      return
    }

    res.setHeader(
      "Content-Type",
      mimeTypes[path.extname(filePath)] ?? "application/octet-stream",
    )

    fs.createReadStream(filePath).pipe(res)
  }

const serveBranding = serveDir(
  "/branding/",
  configDir("branding"),
  brandingMimeTypes,
)

const serveMedia = serveDir("/media/", configDir("media"), mediaMimeTypes)

/** Serves the `config/branding` and `config/media` folders in `vite dev` and `vite preview` (nginx does this in prod). */
const configServer = (): Plugin => ({
  name: "razzia-config-server",
  configureServer(server) {
    server.middlewares.use(serveBranding)
    server.middlewares.use(serveMedia)
  },
  configurePreviewServer(server) {
    server.middlewares.use(serveBranding)
    server.middlewares.use(serveMedia)
  },
})

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    tanstackRouter({
      target: "react",
      routeToken: "layout",
      routesDirectory: "./src/pages",
      generatedRouteTree: "./src/route.gen.ts",
    }),
    react(),
    tailwindcss(),
    configServer(),
  ],
  resolve: {
    alias: {
      "@razzia/web": fileURLToPath(new URL("./src", import.meta.url)),
      "@razzia/common": fileURLToPath(
        new URL("../common/src", import.meta.url),
      ),
      "@razzia/socket": fileURLToPath(
        new URL("../socket/src", import.meta.url),
      ),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/ws": {
        target: "http://localhost:3001",
        ws: true,
      },
      "/api": {
        target: "http://localhost:3001",
      },
    },
  },
  preview: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/ws": {
        target: "http://localhost:3001",
        ws: true,
      },
      "/api": {
        target: "http://localhost:3001",
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
