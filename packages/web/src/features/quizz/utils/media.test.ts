import { isVideoFile } from "@razzia/web/features/quizz/utils/media"
import { describe, expect, it } from "vitest"

const fileNamed = (name: string, type = ""): File =>
  new File(["x"], name, { type })

describe("isVideoFile", () => {
  it("flags known video containers", () => {
    for (const name of ["clip.mp4", "clip.webm", "clip.MOV", "clip.mkv"]) {
      expect(isVideoFile(fileNamed(name))).toBe(true)
    }
  })

  it("accepts images and audio in the allowlist", () => {
    for (const name of ["pic.png", "pic.jpg", "sound.mp3", "sound.ogg"]) {
      expect(isVideoFile(fileNamed(name))).toBe(false)
    }
  })

  it("keeps Ogg audio uploadable even when the browser labels it video/ogg", () => {
    expect(isVideoFile(fileNamed("sound.ogg", "video/ogg"))).toBe(false)
  })

  it("does not flag a file without an extension", () => {
    expect(isVideoFile(fileNamed("noext"))).toBe(false)
  })
})
