import { getPath } from "@razzia/socket/services/config"
import {
  deleteMedia,
  listMedia,
  saveMedia,
} from "@razzia/socket/services/media"
import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"

const PNG_BYTES = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000",
  "hex",
)

const mediaDir = () => getPath("media")

beforeEach(() => {
  fs.rmSync(mediaDir(), { recursive: true, force: true })
})

describe("saveMedia", () => {
  it("detects the type from the content, not the file name", async () => {
    const media = await saveMedia(new File([PNG_BYTES], "Mon Image.gif"))

    expect(media.type).toBe("image")
    expect(media.name).toMatch(/^mon-image-[\w-]{8}\.png$/u)
    expect(media.url).toBe(`/media/${media.name}`)
    expect(fs.existsSync(join(mediaDir(), media.name))).toBe(true)
  })

  it("rejects files that are not an accepted media", async () => {
    await expect(
      saveMedia(new File(["<script></script>"], "evil.png")),
    ).rejects.toThrow("errors:media.invalidType")
  })
})

describe("listMedia", () => {
  it("only lists accepted media files", async () => {
    const media = await saveMedia(new File([PNG_BYTES], "image.png"))

    fs.writeFileSync(join(mediaDir(), "notes.txt"), "")
    fs.writeFileSync(join(mediaDir(), "with space.png"), "")

    expect(listMedia().map((m) => m.name)).toEqual([media.name])
  })
})

describe("deleteMedia", () => {
  it("deletes an uploaded media", async () => {
    const media = await saveMedia(new File([PNG_BYTES], "image.png"))

    deleteMedia(media.name)

    expect(listMedia()).toEqual([])
  })

  it.each(["../secret.png", "image.exe", "image"])(
    "rejects the name %s",
    (name) => {
      expect(() => deleteMedia(name)).toThrow("errors:media.invalidName")
    },
  )

  it("fails on a missing media", () => {
    expect(() => deleteMedia("missing.png")).toThrow("errors:media.notFound")
  })
})
