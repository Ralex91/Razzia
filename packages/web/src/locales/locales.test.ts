import { EVENTS } from "@razzia/common/constants"
import fs from "fs"
import { extname, join } from "path"
import { describe, expect, it } from "vitest"

const LOCALES_DIR = import.meta.dirname
const PACKAGES_DIR = join(import.meta.dirname, "../../..")
const REFERENCE = "en"
const KEY_PATTERN = /["'`]((?:common|errors|game|manager|quizz):[\w.-]+)["'`]/gu

const PLURAL_SUFFIX = /_(?:ordinal_)?(?:zero|one|two|few|many|other)$/u

const SOCKET_EVENTS = new Set<string>(
  Object.values(EVENTS).flatMap((events) => Object.values(events)),
)

type Messages = Record<string, unknown>

const flatten = (messages: Messages, prefix = ""): string[] =>
  Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? flatten(value as Messages, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )

const readKeys = (lang: string) =>
  fs.readdirSync(join(LOCALES_DIR, lang)).flatMap((file) => {
    const namespace = file.replace(/\.json$/u, "")
    const messages = JSON.parse(
      fs.readFileSync(join(LOCALES_DIR, lang, file), "utf-8"),
    ) as Messages

    return flatten(messages).map((key) => `${namespace}:${key}`)
  })

const listSources = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      return listSources(path)
    }

    const isSource = [".ts", ".tsx"].includes(extname(entry.name))

    return isSource && !entry.name.includes(".test.") ? [path] : []
  })

const usedKeys = (packageName: string) =>
  new Set(
    listSources(join(PACKAGES_DIR, packageName, "src")).flatMap((file) =>
      Array.from(
        fs.readFileSync(file, "utf-8").matchAll(KEY_PATTERN),
        ([, key]) => key,
      ),
    ),
  )

const baseKeys = (lang: string) =>
  new Set(readKeys(lang).map((key) => key.replace(PLURAL_SUFFIX, "")))

const pluralKeys = (lang: string) =>
  new Set(
    readKeys(lang)
      .filter((key) => PLURAL_SUFFIX.test(key))
      .map((key) => key.replace(PLURAL_SUFFIX, "")),
  )

const missingPluralForms = (lang: string) => {
  const keys = new Set(readKeys(lang))
  const categories = (type: Intl.PluralRuleType) =>
    new Intl.PluralRules(lang, { type }).resolvedOptions().pluralCategories

  return [...pluralKeys(lang)].flatMap((key) => {
    const isOrdinal = [...keys].some((k) => k.startsWith(`${key}_ordinal_`))
    const prefix = isOrdinal ? `${key}_ordinal` : key

    return categories(isOrdinal ? "ordinal" : "cardinal")
      .map((category) => `${prefix}_${category}`)
      .filter((form) => !keys.has(form))
  })
}

const referenceKeys = baseKeys(REFERENCE)

const languages = fs
  .readdirSync(LOCALES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== REFERENCE)
  .map((entry) => entry.name)

describe("translations", () => {
  it.each(languages)("%s has every english key", (lang) => {
    const keys = baseKeys(lang)

    expect([...referenceKeys].filter((key) => !keys.has(key))).toEqual([])
  })

  it.each(languages)("%s has no unknown key", (lang) => {
    expect(
      [...baseKeys(lang)].filter((key) => !referenceKeys.has(key)),
    ).toEqual([])
  })

  it.each([REFERENCE, ...languages])(
    "%s has every plural form of its language",
    (lang) => {
      expect(missingPluralForms(lang)).toEqual([])
    },
  )

  it.each(["web", "socket", "common"])(
    "every key used in %s exists",
    (packageName) => {
      const missing = [...usedKeys(packageName)].filter(
        (key) => !SOCKET_EVENTS.has(key) && !referenceKeys.has(key),
      )

      expect(missing).toEqual([])
    },
  )
})
