import { MEDIA_TYPES } from "@razzia/common/constants"
import { describe, expect, it } from "vitest"
import { questionMediaValidator } from "./quizz"

const parseUrl = (url: string) =>
  questionMediaValidator.safeParse({ type: MEDIA_TYPES.IMAGE, url })

describe("questionMediaValidator.url", () => {
  it("accepts an absolute URL", () => {
    expect(parseUrl("https://example.com/img.png").success).toBe(true)
  })

  it("accepts an in-platform /media/ path", () => {
    expect(parseUrl("/media/V1StGXR8.png").success).toBe(true)
  })

  it("rejects an arbitrary absolute path", () => {
    expect(parseUrl("/etc/passwd").success).toBe(false)
    expect(parseUrl("/uploads/x.png").success).toBe(false)
  })

  it("rejects a relative or traversal path", () => {
    expect(parseUrl("media/x.png").success).toBe(false)
    expect(parseUrl("../media/x.png").success).toBe(false)
  })

  it("rejects a non-URL string", () => {
    expect(parseUrl("not a url").success).toBe(false)
  })
})
