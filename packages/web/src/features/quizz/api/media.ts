import { MEDIA_TYPES } from "@razzia/common/constants"
import type { StoredMedia } from "@razzia/common/types/game"
import { z } from "zod"

// Media type vocabulary: see packages/common/CONTEXT.md.
const storedMediaSchema = z.object({
  url: z.string(),
  type: z.enum([MEDIA_TYPES.IMAGE, MEDIA_TYPES.AUDIO]),
})

const listResponseSchema = z.array(storedMediaSchema)

const errorResponseSchema = z.object({ code: z.string().optional() })

export class MediaRequestError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, code?: string) {
    super(`Media request failed with status ${status}`)
    this.name = "MediaRequestError"
    this.status = status
    this.code = code
  }
}

export const isSessionExpired = (error: unknown): boolean =>
  error instanceof MediaRequestError && error.status === 401

const readErrorCode = async (
  response: Response,
): Promise<string | undefined> => {
  const parsed = errorResponseSchema.safeParse(
    await response.json().catch(() => undefined),
  )

  return parsed.success ? parsed.data.code : undefined
}

// Auth scheme: ADR-0001 amendment.
const sessionHeaders = (clientId: string): HeadersInit => ({
  "X-Client-Id": clientId,
})

export const uploadMedia = async (
  file: File,
  clientId: string,
): Promise<StoredMedia> => {
  const body = new FormData()
  body.append("file", file)

  const response = await fetch("/api/media", {
    method: "POST",
    headers: sessionHeaders(clientId),
    body,
  })

  if (!response.ok) {
    throw new MediaRequestError(response.status, await readErrorCode(response))
  }

  return storedMediaSchema.parse(await response.json())
}

export const listMedia = async (clientId: string): Promise<StoredMedia[]> => {
  const response = await fetch("/api/media", {
    headers: sessionHeaders(clientId),
  })

  if (!response.ok) {
    throw new MediaRequestError(response.status)
  }

  return listResponseSchema.parse(await response.json())
}

export const deleteMedia = async (
  file: string,
  clientId: string,
): Promise<void> => {
  const response = await fetch(`/api/media/${encodeURIComponent(file)}`, {
    method: "DELETE",
    headers: sessionHeaders(clientId),
  })

  // 404 means the image is already gone — the desired end state, so idempotent.
  if (!response.ok && response.status !== 404) {
    throw new MediaRequestError(response.status)
  }
}
