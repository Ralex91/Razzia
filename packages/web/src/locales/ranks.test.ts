import fs from "fs"
import i18next, { type Resource } from "i18next"
import { join } from "path"
import { beforeAll, describe, expect, it } from "vitest"

const LOCALES_DIR = import.meta.dirname
const languages = fs
  .readdirSync(LOCALES_DIR)
  .filter((name) => !name.includes("."))

const resources = Object.fromEntries(
  languages.map((lang) => [
    lang,
    {
      game: JSON.parse(
        fs.readFileSync(join(LOCALES_DIR, lang, "game.json"), "utf-8"),
      ) as Record<string, unknown>,
    },
  ]),
) as Resource

const i18n = i18next.createInstance()

const rank = (lang: string, count: number) =>
  i18n.t("game:rank", { lng: lang, count, ordinal: true })

beforeAll(async () => {
  await i18n.init({ resources, fallbackLng: false })
})

describe("rank translations", () => {
  it.each([
    [1, "1st place"],
    [2, "2nd place"],
    [3, "3rd place"],
    [4, "4th place"],
    [11, "11th place"],
    [12, "12th place"],
    [13, "13th place"],
    [21, "21st place"],
    [22, "22nd place"],
    [23, "23rd place"],
  ])("writes rank %d in english as %s", (count, expected) => {
    expect(rank("en", count)).toBe(expected)
  })

  it.each(languages)("translates every rank in %s", (lang) => {
    ;[1, 2, 3, 4, 5, 11, 21, 22, 23, 101].forEach((count) => {
      const translated = rank(lang, count)

      expect(translated).toContain(String(count))
      expect(translated).not.toContain("rank")
    })
  })
})
