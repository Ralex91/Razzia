export type MediaErrorCode =
  | "unsupported-type"
  | "video-not-hosted"
  | "invalid-name"
  | "not-found"

const MESSAGES: Record<MediaErrorCode, string> = {
  "unsupported-type": "Unsupported media type",
  "video-not-hosted": "Videos are not hosted; attach them by URL",
  "invalid-name": "Invalid media filename",
  "not-found": "Media not found",
}

/**
 * A media operation failure. `code` lets the HTTP layer branch on the cause
 * (bad upload type, malformed filename, missing file) without parsing messages.
 */
export class MediaError extends Error {
  readonly code: MediaErrorCode

  constructor(code: MediaErrorCode) {
    super(MESSAGES[code])
    this.name = "MediaError"
    this.code = code
  }
}
