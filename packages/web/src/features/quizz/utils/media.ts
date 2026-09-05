/**
 * Extension-based rather than `file.type`, because Firefox reports Ogg audio as
 * `video/ogg`. The server 415 stays as the safety net for anything not listed.
 */
const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".mov",
  ".mkv",
  ".avi",
  ".m4v",
])

const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf(".")

  return dot === -1 ? "" : name.slice(dot).toLowerCase()
}

export const isVideoFile = (file: File): boolean =>
  VIDEO_EXTENSIONS.has(extensionOf(file.name))
