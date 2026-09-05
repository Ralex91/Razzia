import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import fs from "node:fs"
import type { IncomingMessage, ServerResponse } from "node:http"
import path from "node:path"
import { fileURLToPath } from "url"
import { defineConfig, type Plugin } from "vite"
import { version } from "../../package.json"
import { ACCEPTED_MEDIA_TYPES } from "../common/src/constants"

const brandingDir = fileURLToPath(
  new URL("../../config/branding", import.meta.url),
)

// Same physical dir as the socket's dev default (<repo-root>/media), so a file
// uploaded through the dev backend is immediately servable here.
const mediaDir = fileURLToPath(new URL("../../media", import.meta.url))

const mediaMimeTypes: Record<string, string> = Object.fromEntries(
  Object.entries(ACCEPTED_MEDIA_TYPES).map(([mime, { ext }]) => [ext, mime]),
)

const serveMedia = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void => {
  if (!req.url?.startsWith("/media/")) {
    next()

    return
  }

  const [relative] = req.url.replace(/^\/media\//, "").split("?")
  const filePath = path.join(mediaDir, relative)

  if (!filePath.startsWith(mediaDir + path.sep) || !fs.existsSync(filePath)) {
    res.statusCode = 404
    res.end()

    return
  }

  // Mirror the production nginx headers so dev and prod behave the same:
  // <audio>/<video> need Content-Length and Range (206) to seek and know the duration.
  const { size } = fs.statSync(filePath)
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("Accept-Ranges", "bytes")
  res.setHeader(
    "Content-Type",
    mediaMimeTypes[path.extname(filePath)] ?? "application/octet-stream",
  )

  const range = /^bytes=(\d*)-(\d*)$/u.exec(req.headers.range ?? "")

  if (!range) {
    res.setHeader("Content-Length", size)
    fs.createReadStream(filePath).pipe(res)

    return
  }

  const start = range[1]
    ? Number(range[1])
    : Math.max(0, size - Number(range[2]))
  const end =
    range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1

  if (start >= size || start > end) {
    res.statusCode = 416
    res.setHeader("Content-Range", `bytes */${size}`)
    res.end()

    return
  }

  res.statusCode = 206
  res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`)
  res.setHeader("Content-Length", end - start + 1)
  fs.createReadStream(filePath, { start, end }).pipe(res)
}

/** Serves uploaded media at `/media/` in `vite dev` and `vite preview` (nginx does this in prod). */
const mediaServer = (): Plugin => ({
  name: "razzia-media-server",
  configureServer(server) {
    server.middlewares.use(serveMedia)
  },
  configurePreviewServer(server) {
    server.middlewares.use(serveMedia)
  },
})

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

const serveBranding = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void => {
  if (!req.url?.startsWith("/branding/")) {
    next()

    return
  }

  const [relative] = req.url.replace(/^\/branding\//, "").split("?")
  const filePath = path.join(brandingDir, relative)

  if (
    !filePath.startsWith(brandingDir + path.sep) ||
    !fs.existsSync(filePath)
  ) {
    res.statusCode = 404
    res.end()

    return
  }

  res.setHeader(
    "Content-Type",
    brandingMimeTypes[path.extname(filePath)] ?? "application/octet-stream",
  )

  fs.createReadStream(filePath).pipe(res)
}

/** Serves the optional `config/branding` folder at `/branding/` in `vite dev` and `vite preview` (nginx does this in prod). */
const brandingServer = (): Plugin => ({
  name: "razzia-branding-server",
  configureServer(server) {
    server.middlewares.use(serveBranding)
  },
  configurePreviewServer(server) {
    server.middlewares.use(serveBranding)
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
    brandingServer(),
    mediaServer(),
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
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
