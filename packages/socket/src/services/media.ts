import { ACCEPTED_MEDIA_TYPES } from "@razzia/common/constants"
import type { StoredMedia } from "@razzia/common/types/game"
import { MediaError } from "@razzia/socket/services/media-errors"
import { fileTypeFromBuffer } from "file-type"
import fs from "fs"
import { nanoid } from "nanoid"
import { basename, extname, resolve, sep } from "path"

/** Maximum accepted upload size, enforced by multer before the buffer completes. */
export const MAX_MEDIA_BYTES = 20 * 1024 * 1024

/** Extension (with dot) → media type, from the accepted-media allowlist. */
const EXTENSION_TYPES = new Map(
  Object.values(ACCEPTED_MEDIA_TYPES).map(({ ext, type }) => [ext, type]),
)

// `name` is either server-generated or already validated against
// MEDIA_NAME_PATTERN; callers must never pass a raw browser-supplied name.
export const getMediaPath = (name = ""): string => {
  const mediaPathEnv = process.env.MEDIA_PATH

  return mediaPathEnv
    ? resolve(mediaPathEnv, name)
    : resolve(process.cwd(), "../../media", name)
}

export const ensureMediaDir = (): void => {
  const dir = getMediaPath()

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/** Keeps the stored name readable while staying well under any path limit. */
const MAX_BASE_LENGTH = 64

/** Random part appended to the original name to keep stored names unique. */
const SUFFIX_LENGTH = 6

/**
 * Reduces a browser-supplied name to the alphabet of MEDIA_NAME_PATTERN, so no
 * path separator, dot segment or non-ASCII byte can survive into the filename.
 * Multer decodes the name as latin1, hence the re-decode before folding accents.
 */
const sanitizeBaseName = (name: string): string => {
  const decoded = Buffer.from(name, "latin1").toString("utf8")

  return (
    basename(decoded)
      .replace(/\.[^.]*$/u, "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^A-Za-z0-9_-]+/gu, "-")
      .replace(/-{2,}/gu, "-")
      .replace(/^[-_]+|[-_]+$/gu, "")
      .slice(0, MAX_BASE_LENGTH) || "media"
  )
}

/**
 * Detects the real type from the buffer's magic bytes (never the client-declared
 * MIME), rejects anything not in the accepted-media allowlist, and writes
 * `${sanitized original name}_${nanoid()}${ext}` — the original name is kept so
 * the media library stays browsable, the random suffix avoids collisions. The
 * extension always comes from the magic bytes, never from the uploaded name.
 * Returns the file's relative URL and its media type.
 */
export const saveMedia = async (
  buffer: Buffer,
  originalName = "",
): Promise<StoredMedia> => {
  const detected = await fileTypeFromBuffer(buffer)
  // Some containers report a codec parameter (e.g. "audio/ogg; codecs=opus");
  // the allowlist is keyed by the bare MIME, so strip it before the lookup.
  const mime = detected?.mime.split(";")[0].trim()
  const accepted = mime ? ACCEPTED_MEDIA_TYPES[mime] : undefined

  if (!accepted) {
    throw new MediaError(
      mime?.startsWith("video/") ? "video-not-hosted" : "unsupported-type",
    )
  }

  ensureMediaDir()

  const base = sanitizeBaseName(originalName)
  let name = `${base}_${nanoid(SUFFIX_LENGTH)}${accepted.ext}`

  while (fs.existsSync(getMediaPath(name))) {
    name = `${base}_${nanoid(SUFFIX_LENGTH)}${accepted.ext}`
  }

  fs.writeFileSync(getMediaPath(name), buffer)

  return { url: `/media/${name}`, type: accepted.type }
}

/**
 * Lists the uploaded media as `{ url, type }`, the type derived from the file's
 * extension via the accepted-media allowlist. Lstat (not stat) so a symlink
 * planted in the dir is skipped instead of followed, mirroring listJsonFiles in
 * services/config.ts.
 */
export const listMedia = (): StoredMedia[] => {
  const dir = getMediaPath()

  if (!fs.existsSync(dir)) {
    return []
  }

  return fs.readdirSync(dir).flatMap((name) => {
    const type = EXTENSION_TYPES.get(extname(name).toLowerCase())

    if (!type) {
      return []
    }

    try {
      if (!fs.lstatSync(getMediaPath(name)).isFile()) {
        return []
      }
    } catch {
      return []
    }

    return [{ url: `/media/${name}`, type }]
  })
}

// A stored name (sanitized base + nanoid suffix, or a bare nanoid for files
// uploaded before names were kept) plus one of the actually-produced extensions.
// Any slash, backslash or ".." fails to match, so a browser-supplied name can
// never escape the dir.
const NAME_EXTENSIONS = [...EXTENSION_TYPES.keys()]
  .map((ext) => ext.slice(1))
  .join("|")
const MEDIA_NAME_PATTERN = new RegExp(
  `^[A-Za-z0-9_-]+\\.(${NAME_EXTENSIONS})$`,
  "iu",
)

/**
 * Deletes an uploaded image by its stored filename. Lstats (not stats) so a
 * planted symlink is rejected rather than followed, as in listMedia.
 */
export const deleteMedia = (file: string): void => {
  if (!MEDIA_NAME_PATTERN.test(file)) {
    throw new MediaError("invalid-name")
  }

  const path = getMediaPath(file)

  if (!path.startsWith(getMediaPath() + sep)) {
    throw new MediaError("not-found")
  }

  try {
    if (!fs.lstatSync(path).isFile()) {
      throw new MediaError("not-found")
    }
  } catch {
    throw new MediaError("not-found")
  }

  fs.unlinkSync(path)
}
