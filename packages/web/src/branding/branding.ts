/**
 * Optional runtime theming.
 *
 * On startup the app tries to load `/branding/theme.json` (served from the
 * mounted `config/branding` folder in production via nginx, or from
 * `config/branding` in dev via a small Vite middleware).
 *
 * - If the file is present, its values override the defaults (colors, answer
 *   colors, font, app name, logo, favicon, background).
 * - If it is absent, the app keeps its default (vanilla) appearance.
 *
 * This keeps all branding out of the source code: an empty folder = stock app.
 */

export interface BrandingTheme {
  /** Displayed app name + browser tab title. */
  appName?: string
  /** CSS color tokens, e.g. `{ "primary": "#ff9900", "secondary": "#1a140b" }`. */
  colors?: Record<string, string>
  /** Up to 4 colors for the answer buttons. */
  answerColors?: string[]
  /** Custom font: a family name and an optional stylesheet URL (e.g. Google Fonts). */
  font?: { family: string; url?: string }
  /** Path to a logo, e.g. `/branding/logo.svg`. */
  logo?: string
  /** Path to a favicon, e.g. `/branding/favicon.svg`. */
  favicon?: string
  /** Path to a background image, e.g. `/branding/background.png`. */
  background?: string
}

let current: BrandingTheme | null = null

/** The branding loaded at startup (null = defaults). */
export const getBranding = (): BrandingTheme | null => current

/** Fetch `/branding/theme.json`. Returns null if absent or invalid. */
export const loadBranding = async (): Promise<BrandingTheme | null> => {
  try {
    const response = await fetch("/branding/theme.json", {
      cache: "no-cache",
      signal: AbortSignal.timeout(2000),
    })

    if (!response.ok) {
      return null
    }

    current = (await response.json()) as BrandingTheme

    return current
  } catch {
    return null
  }
}

/** Apply a loaded theme to the document (CSS variables, font, title, favicon). */
export const applyBranding = (theme: BrandingTheme | null): void => {
  if (!theme) {
    return
  }

  const root = document.documentElement

  if (theme.colors) {
    for (const [name, value] of Object.entries(theme.colors)) {
      root.style.setProperty(`--color-${name}`, value)
    }
  }

  theme.answerColors?.forEach((color, index) => {
    root.style.setProperty(`--color-answer-${index + 1}`, color)
  })

  if (theme.font) {
    if (theme.font.url) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = theme.font.url
      document.head.appendChild(link)
    }

    root.style.setProperty("--font-display", `"${theme.font.family}", sans-serif`)
  }

  if (theme.appName) {
    document.title = theme.appName
  }

  if (theme.favicon) {
    const favicon = document.querySelector<HTMLLinkElement>("link#favicon")

    if (favicon) {
      favicon.href = theme.favicon
    }
  }
}
