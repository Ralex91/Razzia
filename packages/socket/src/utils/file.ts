import { nanoid } from "nanoid"

export const normalizeFilename = (
  subject: string,
  { fallback, maxLength = 10 }: { fallback: string; maxLength?: number },
) => {
  const slug =
    subject
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/gu, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/gu, "-")
      .replace(/[^a-z0-9-]/gu, "")
      .slice(0, maxLength)
      .replace(/^-+|-+$/gu, "") || fallback

  const shortId = nanoid(8)

  return `${slug}-${shortId}`
}
