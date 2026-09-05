import type { Socket } from "@razzia/common/types/game/socket"
import { createApp } from "@razzia/socket/http/server"
import manager from "@razzia/socket/services/manager"
import fs from "fs"
import os from "os"
import { join, resolve } from "path"
import request from "supertest"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const CLIENT_ID = "manager-client-id"

const managerSocket = {
  handshake: { auth: { clientId: CLIENT_ID } },
} as unknown as Socket

// Minimal valid image buffers — enough magic bytes for file-type to detect.
const pngBuffer = (): Buffer => {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ])
  const ihdr = Buffer.from([
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89,
  ])

  return Buffer.concat([signature, ihdr])
}

// Minimal audio buffers — enough magic bytes for file-type to detect the type.
const mp3Buffer = (): Buffer =>
  Buffer.concat([
    Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    Buffer.from([0xff, 0xfb, 0x90, 0x00]),
  ])

const oggPage = (payload: Buffer): Buffer => {
  const header = Buffer.alloc(28)
  header.write("OggS", 0, "ascii")

  return Buffer.concat([header, payload, Buffer.alloc(8)])
}

const oggBuffer = (): Buffer =>
  oggPage(Buffer.concat([Buffer.from([0x01]), Buffer.from("vorbis")]))

const opusBuffer = (): Buffer => oggPage(Buffer.from("OpusHead"))

const wavBuffer = (): Buffer =>
  Buffer.concat([
    Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
      0x66, 0x6d, 0x74, 0x20,
    ]),
    Buffer.alloc(40),
  ])

const mp4Buffer = (): Buffer =>
  Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x18]),
    Buffer.from("ftypisom"),
    Buffer.from([0x00, 0x00, 0x02, 0x00]),
    Buffer.from("isommp41"),
    Buffer.alloc(16),
  ])

const webmBuffer = (): Buffer =>
  Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01]),
    Buffer.from([0x42, 0x82, 0x84]),
    Buffer.from("webm"),
    Buffer.alloc(16),
  ])

let mediaDir = ""

beforeEach(() => {
  mediaDir = fs.mkdtempSync(join(os.tmpdir(), "razzia-media-"))
  process.env.MEDIA_PATH = mediaDir
  manager.login(managerSocket)
})

// Manager is a module-level singleton: log out so no test inherits a session.
afterEach(() => {
  manager.logout(managerSocket)
  fs.rmSync(mediaDir, { recursive: true, force: true })
  delete process.env.MEDIA_PATH
})

const filesInMediaDir = (): string[] =>
  fs.existsSync(mediaDir) ? fs.readdirSync(mediaDir) : []

describe("POST /api/media", () => {
  it("rejects a request with no X-Client-Id header (401)", async () => {
    const res = await request(createApp())
      .post("/api/media")
      .attach("file", pngBuffer(), {
        filename: "x.png",
        contentType: "image/png",
      })

    expect(res.status).toBe(401)
    expect(filesInMediaDir()).toHaveLength(0)
  })

  it("rejects an unknown client id (401)", async () => {
    const res = await request(createApp())
      .post("/api/media")
      .set("X-Client-Id", "unknown-client-id")
      .attach("file", pngBuffer(), {
        filename: "x.png",
        contentType: "image/png",
      })

    expect(res.status).toBe(401)
    expect(filesInMediaDir()).toHaveLength(0)
  })

  it("rejects a client id whose session has been logged out (401)", async () => {
    manager.logout(managerSocket)

    const res = await request(createApp())
      .post("/api/media")
      .set("X-Client-Id", CLIENT_ID)
      .attach("file", pngBuffer(), {
        filename: "x.png",
        contentType: "image/png",
      })

    expect(res.status).toBe(401)
    expect(filesInMediaDir()).toHaveLength(0)
  })

  it("accepts a valid image from a logged manager (201) and writes it to disk", async () => {
    const res = await request(createApp())
      .post("/api/media")
      .set("X-Client-Id", CLIENT_ID)
      .attach("file", pngBuffer(), {
        filename: "x.png",
        contentType: "image/png",
      })

    const body = res.body as { url: string; type: string }

    expect(res.status).toBe(201)
    expect(body.url).toMatch(/^\/media\/[\w-]+\.png$/u)
    expect(body.type).toBe("image")

    const name = body.url.replace("/media/", "")
    expect(fs.existsSync(resolve(mediaDir, name))).toBe(true)
  })

  it.each([
    { label: "mp3", buffer: mp3Buffer, mime: "audio/mpeg", ext: "mp3" },
    { label: "ogg", buffer: oggBuffer, mime: "audio/ogg", ext: "ogg" },
    { label: "wav", buffer: wavBuffer, mime: "audio/wav", ext: "wav" },
  ])(
    "accepts a valid $label upload (201), assigns .$ext and audio type",
    async ({ buffer, mime, ext }) => {
      const res = await request(createApp())
        .post("/api/media")
        .set("X-Client-Id", CLIENT_ID)
        .attach("file", buffer(), { filename: `x.${ext}`, contentType: mime })

      const body = res.body as { url: string; type: string }

      expect(res.status).toBe(201)
      expect(body.url).toMatch(new RegExp(`^/media/[\\w-]+\\.${ext}$`, "u"))
      expect(body.type).toBe("audio")

      const name = body.url.replace("/media/", "")
      expect(fs.existsSync(resolve(mediaDir, name))).toBe(true)
    },
  )

  it.each([
    {
      label: "Ogg audio declared as video/ogg (Firefox)",
      buffer: oggBuffer,
      mime: "video/ogg",
      ext: "ogg",
    },
    { label: "Ogg Opus", buffer: opusBuffer, mime: "audio/ogg", ext: "ogg" },
    {
      label: "WAV declared as audio/x-wav",
      buffer: wavBuffer,
      mime: "audio/x-wav",
      ext: "wav",
    },
  ])(
    "accepts $label from its magic bytes regardless of the declared MIME (201)",
    async ({ buffer, mime, ext }) => {
      const res = await request(createApp())
        .post("/api/media")
        .set("X-Client-Id", CLIENT_ID)
        .attach("file", buffer(), { filename: `x.${ext}`, contentType: mime })

      const body = res.body as { url: string; type: string }

      expect(res.status).toBe(201)
      expect(body.url).toMatch(new RegExp(`^/media/[\\w-]+\\.${ext}$`, "u"))
      expect(body.type).toBe("audio")
    },
  )

  it.each([
    { label: "mp4", buffer: mp4Buffer, mime: "video/mp4", ext: "mp4" },
    { label: "webm", buffer: webmBuffer, mime: "video/webm", ext: "webm" },
  ])(
    "rejects a $label video with the video-not-hosted code (415)",
    async ({ buffer, mime, ext }) => {
      const res = await request(createApp())
        .post("/api/media")
        .set("X-Client-Id", CLIENT_ID)
        .attach("file", buffer(), { filename: `x.${ext}`, contentType: mime })

      expect(res.status).toBe(415)
      expect((res.body as { code: string }).code).toBe("video-not-hosted")
      expect(filesInMediaDir()).toHaveLength(0)
    },
  )

  it("rejects a non-media file (415)", async () => {
    const res = await request(createApp())
      .post("/api/media")
      .set("X-Client-Id", CLIENT_ID)
      .attach("file", Buffer.from("hello world"), {
        filename: "x.txt",
        contentType: "text/plain",
      })

    expect(res.status).toBe(415)
    expect((res.body as { code: string }).code).toBe("unsupported-type")
    expect(filesInMediaDir()).toHaveLength(0)
  })

  it("rejects a spoofed MIME (non-image bytes sent as image/png) (415)", async () => {
    const res = await request(createApp())
      .post("/api/media")
      .set("X-Client-Id", CLIENT_ID)
      .attach("file", Buffer.from("<html>not an image</html>"), {
        filename: "x.png",
        contentType: "image/png",
      })

    expect(res.status).toBe(415)
    expect(filesInMediaDir()).toHaveLength(0)
  })

  it("rejects an oversize file (413)", async () => {
    const oversize = Buffer.concat([
      pngBuffer(),
      Buffer.alloc(20 * 1024 * 1024),
    ])

    const res = await request(createApp())
      .post("/api/media")
      .set("X-Client-Id", CLIENT_ID)
      .attach("file", oversize, { filename: "x.png", contentType: "image/png" })

    expect(res.status).toBe(413)
    expect(filesInMediaDir()).toHaveLength(0)
  })

  it("returns 400 when no file part is present", async () => {
    const res = await request(createApp())
      .post("/api/media")
      .set("X-Client-Id", CLIENT_ID)

    expect(res.status).toBe(400)
  })
})

describe("GET /api/media", () => {
  it("rejects a request with no X-Client-Id header (401)", async () => {
    const res = await request(createApp()).get("/api/media")

    expect(res.status).toBe(401)
  })

  it("rejects an unknown client id (401)", async () => {
    const res = await request(createApp())
      .get("/api/media")
      .set("X-Client-Id", "unknown-client-id")

    expect(res.status).toBe(401)
  })

  it("rejects a client id whose session has been logged out (401)", async () => {
    manager.logout(managerSocket)

    const res = await request(createApp())
      .get("/api/media")
      .set("X-Client-Id", CLIENT_ID)

    expect(res.status).toBe(401)
  })

  it("returns each accepted file as { url, type }, skipping unknown types (200)", async () => {
    fs.writeFileSync(join(mediaDir, "a.png"), pngBuffer())
    fs.writeFileSync(join(mediaDir, "b.mp3"), mp3Buffer())
    fs.writeFileSync(join(mediaDir, "notes.txt"), "hello")

    const res = await request(createApp())
      .get("/api/media")
      .set("X-Client-Id", CLIENT_ID)

    const body = res.body as Array<{ url: string; type: string }>

    expect(res.status).toBe(200)
    expect(body).toHaveLength(2)
    expect(body).toEqual(
      expect.arrayContaining([
        { url: "/media/a.png", type: "image" },
        { url: "/media/b.mp3", type: "audio" },
      ]),
    )
    expect(body.map((item) => item.url)).not.toContain("/media/notes.txt")
  })

  it("returns an empty array when the media directory has no media (200)", async () => {
    const res = await request(createApp())
      .get("/api/media")
      .set("X-Client-Id", CLIENT_ID)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

describe("DELETE /api/media/:file", () => {
  it("rejects a request with no X-Client-Id header (401)", async () => {
    fs.writeFileSync(join(mediaDir, "a.png"), pngBuffer())

    const res = await request(createApp()).delete("/api/media/a.png")

    expect(res.status).toBe(401)
    expect(filesInMediaDir()).toContain("a.png")
  })

  it("rejects an unknown client id (401)", async () => {
    fs.writeFileSync(join(mediaDir, "a.png"), pngBuffer())

    const res = await request(createApp())
      .delete("/api/media/a.png")
      .set("X-Client-Id", "unknown-client-id")

    expect(res.status).toBe(401)
    expect(filesInMediaDir()).toContain("a.png")
  })

  it("rejects a client id whose session has been logged out (401)", async () => {
    fs.writeFileSync(join(mediaDir, "a.png"), pngBuffer())
    manager.logout(managerSocket)

    const res = await request(createApp())
      .delete("/api/media/a.png")
      .set("X-Client-Id", CLIENT_ID)

    expect(res.status).toBe(401)
    expect(filesInMediaDir()).toContain("a.png")
  })

  it("deletes the file for a logged manager (204) and removes it from disk", async () => {
    fs.writeFileSync(join(mediaDir, "a.png"), pngBuffer())

    const res = await request(createApp())
      .delete("/api/media/a.png")
      .set("X-Client-Id", CLIENT_ID)

    expect(res.status).toBe(204)
    expect(filesInMediaDir()).not.toContain("a.png")
  })

  it("rejects a malformed filename (400) without touching disk", async () => {
    fs.writeFileSync(join(mediaDir, "a.png"), pngBuffer())

    const res = await request(createApp())
      .delete("/api/media/a.txt")
      .set("X-Client-Id", CLIENT_ID)

    expect(res.status).toBe(400)
    expect(filesInMediaDir()).toContain("a.png")
  })

  it("rejects a traversal attempt without touching files outside the media dir", async () => {
    const outside = join(mediaDir, "..", "secret.png")
    fs.writeFileSync(outside, pngBuffer())

    const res = await request(createApp())
      .delete("/api/media/..%2Fsecret.png")
      .set("X-Client-Id", CLIENT_ID)

    expect([400, 404]).toContain(res.status)
    expect(fs.existsSync(outside)).toBe(true)

    fs.rmSync(outside, { force: true })
  })

  it("returns 404 for a well-formed name that does not exist", async () => {
    const res = await request(createApp())
      .delete("/api/media/V1StGXR8.png")
      .set("X-Client-Id", CLIENT_ID)

    expect(res.status).toBe(404)
  })
})
