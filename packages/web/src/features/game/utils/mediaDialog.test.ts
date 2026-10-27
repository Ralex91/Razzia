import { shouldCloseMediaDialog } from "@razzia/web/features/game/utils/mediaDialog"
import { describe, expect, it } from "vitest"

const target = (tagName: string) => ({ tagName }) as unknown as EventTarget

describe("shouldCloseMediaDialog", () => {
  it("closes when the image is tapped", () => {
    expect(shouldCloseMediaDialog(target("IMG"))).toBe(true)
  })

  it("closes when the title is tapped", () => {
    expect(shouldCloseMediaDialog(target("H2"))).toBe(true)
  })

  it("closes when the empty area is tapped", () => {
    expect(shouldCloseMediaDialog(target("DIV"))).toBe(true)
  })

  it("keeps a video open so its controls stay usable", () => {
    expect(shouldCloseMediaDialog(target("VIDEO"))).toBe(false)
  })

  it("keeps an audio player open so its controls stay usable", () => {
    expect(shouldCloseMediaDialog(target("AUDIO"))).toBe(false)
  })

  it("closes when there is no target", () => {
    expect(shouldCloseMediaDialog(null)).toBe(true)
  })
})
