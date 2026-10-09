import { estimationAccuracy } from "@razzia/common/questions/estimation"
import { describe, expect, it } from "vitest"

describe("estimationAccuracy", () => {
  it("gives full accuracy for an exact answer", () => {
    expect(estimationAccuracy(50, 50, 10)).toBe(1)
  })

  it("decreases linearly down to half accuracy at the margin", () => {
    expect(estimationAccuracy(55, 50, 10)).toBe(0.75)
    expect(estimationAccuracy(40, 50, 10)).toBe(0.5)
  })

  it("gives nothing outside of the margin", () => {
    expect(estimationAccuracy(61, 50, 10)).toBe(0)
  })

  it("only accepts the exact value with a zero margin", () => {
    expect(estimationAccuracy(50, 50, 0)).toBe(1)
    expect(estimationAccuracy(51, 50, 0)).toBe(0)
  })
})
