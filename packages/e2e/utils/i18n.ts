import fs from "fs"
import i18next, { type Resource, type TOptions } from "i18next"
import { join } from "path"

const LOCALES_DIR = join(import.meta.dirname, "../../web/src/locales")

const readNamespaces = (lang: string) =>
  Object.fromEntries(
    fs
      .readdirSync(join(LOCALES_DIR, lang))
      .map((file) => [
        file.replace(/\.json$/u, ""),
        JSON.parse(
          fs.readFileSync(join(LOCALES_DIR, lang, file), "utf-8"),
        ) as Record<string, unknown>,
      ]),
  )

const resources: Resource = Object.fromEntries(
  fs
    .readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [entry.name, readNamespaces(entry.name)]),
)

const i18n = i18next.createInstance()

void i18n.init({
  lng: "en",
  resources,
  initAsync: false,
  interpolation: { escapeValue: false },
})

export const t = (key: string, options?: TOptions) => i18n.t(key, options)
