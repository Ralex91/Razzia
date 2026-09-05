import { requireManager } from "@razzia/socket/http/auth"
import { MediaError } from "@razzia/socket/services/media-errors"
import {
  deleteMedia,
  listMedia,
  MAX_MEDIA_BYTES,
  saveMedia,
} from "@razzia/socket/services/media"
import { type NextFunction, type Request, type Response, Router } from "express"
import multer, { MulterError } from "multer"

const MEDIA_ERROR_STATUS: Record<MediaError["code"], number> = {
  "unsupported-type": 415,
  "video-not-hosted": 415,
  "invalid-name": 400,
  "not-found": 404,
}

// No fileFilter on the browser-declared MIME: browsers disagree on it (Firefox
// sends video/ogg for Ogg audio), so saveMedia's magic-byte check is the only gate.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MEDIA_BYTES },
})

const handleUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" })

    return
  }

  try {
    const stored = await saveMedia(req.file.buffer)

    res.status(201).json(stored)
  } catch (error) {
    next(error)
  }
}

const handleList = (_req: Request, res: Response): void => {
  res.status(200).json(listMedia())
}

const handleDelete = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    deleteMedia(req.params.file as string)

    res.status(204).end()
  } catch (error) {
    next(error)
  }
}

// Express recognises error-handling middleware by its four-arg signature.
// eslint-disable-next-line max-params
const handleError = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (error instanceof MediaError) {
    res
      .status(MEDIA_ERROR_STATUS[error.code])
      .json({ error: error.message, code: error.code })

    return
  }

  if (error instanceof MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File too large" })

      return
    }

    res.status(400).json({ error: error.message })

    return
  }

  next(error)
}

// eslint-disable-next-line new-cap
export const mediaRouter = Router()

mediaRouter.get("/media", requireManager, handleList)
mediaRouter.post("/media", requireManager, upload.single("file"), handleUpload)
mediaRouter.delete("/media/:file", requireManager, handleDelete)
mediaRouter.use(handleError)
