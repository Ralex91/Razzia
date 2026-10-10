import {
  ACCEPTED_MEDIA_TYPES,
  MEDIA_URL_PREFIX,
} from "@razzia/common/constants"
import type {
  UploadedMedia,
  UploadedMediaType,
} from "@razzia/common/types/game"
import { getPath } from "@razzia/socket/services/config"
import {
  invalidInput,
  notFound,
  unsupportedMediaType,
} from "@razzia/socket/services/errors"
import { normalizeFilename } from "@razzia/socket/utils/file"
import { fileTypeFromBuffer } from "file-type"
import fs from "fs"
import { extname, join } from "path"

const MAX_SLUG_LENGTH = 32

const EXTENSION_TYPES = new Map<string, UploadedMediaType>(
  Object.values(ACCEPTED_MEDIA_TYPES).map(({ ext, type }) => [ext, type]),
)

const EXTENSIONS = [...EXTENSION_TYPES.keys()]
  .map((ext) => ext.slice(1))
  .join("|")

const MEDIA_NAME_PATTERN = new RegExp(`^[A-Za-z0-9_-]+\\.(${EXTENSIONS})$`, "u")

const getMediaDir = () => getPath("media")

const isAcceptedMime = (
  mime: string,
): mime is keyof typeof ACCEPTED_MEDIA_TYPES => mime in ACCEPTED_MEDIA_TYPES

const toUploadedMedia = (
  name: string,
  type: UploadedMediaType,
): UploadedMedia => ({ name, url: `${MEDIA_URL_PREFIX}${name}`, type })

const isRegularFile = (path: string) => {
  try {
    return fs.lstatSync(path).isFile()
  } catch {
    return false
  }
}

export const listMedia = (): UploadedMedia[] => {
  const dir = getMediaDir()

  if (!fs.existsSync(dir)) {
    return []
  }

  return fs
    .readdirSync(dir)
    .flatMap((name) => {
      const type = EXTENSION_TYPES.get(extname(name))
      const path = join(dir, name)

      if (!type || !MEDIA_NAME_PATTERN.test(name) || !isRegularFile(path)) {
        return []
      }

      return [
        {
          media: toUploadedMedia(name, type),
          mtime: fs.statSync(path).mtimeMs,
        },
      ]
    })
    .sort((a, b) => b.mtime - a.mtime)
    .map(({ media }) => media)
}

export const saveMedia = async (file: File): Promise<UploadedMedia> => {
  const buffer = Buffer.from(await file.arrayBuffer())
  const detected = await fileTypeFromBuffer(buffer)

  if (!detected || !isAcceptedMime(detected.mime)) {
    throw unsupportedMediaType("errors:media.invalidType")
  }

  const { ext, type } = ACCEPTED_MEDIA_TYPES[detected.mime]
  const dir = getMediaDir()
  const baseName = file.name.replace(/\.[^.]*$/u, "")
  const generateName = () =>
    `${normalizeFilename(baseName, { fallback: "media", maxLength: MAX_SLUG_LENGTH })}${ext}`

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  let name = generateName()

  while (fs.existsSync(join(dir, name))) {
    name = generateName()
  }

  fs.writeFileSync(join(dir, name), buffer)

  return toUploadedMedia(name, type)
}

export const deleteMedia = (name: string): void => {
  if (!MEDIA_NAME_PATTERN.test(name)) {
    throw invalidInput("errors:media.invalidName")
  }

  const path = join(getMediaDir(), name)

  if (!isRegularFile(path)) {
    throw notFound("errors:media.notFound")
  }

  fs.unlinkSync(path)
}
