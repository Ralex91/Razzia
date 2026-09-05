import { EXAMPLE_QUIZZ } from "@razzia/common/constants"
import type {
  GameResult,
  GameResultMeta,
  QuizzWithId,
} from "@razzia/common/types/game"
import {
  normalizeLegacyQuizz,
  quizzValidator,
} from "@razzia/common/validators/quizz"
import { normalizeFilename } from "@razzia/socket/utils/game"
import fs from "fs"
import { nanoid } from "nanoid"
import { join, resolve } from "path"

interface GameConfig {
  managerPassword: string
}

const inContainerPath = process.env.CONFIG_PATH

const getPath = (path = "") =>
  inContainerPath
    ? resolve(inContainerPath, path)
    : resolve(process.cwd(), "../../config", path)

const readJson = (filePath: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<
      string,
      unknown
    >
  } catch {
    return null
  }
}

// Lstat (not stat) so a symlink planted in the config dir is skipped instead
// of followed outside it.
const listJsonFiles = (dirPath: string): string[] =>
  fs.readdirSync(dirPath).filter((file) => {
    if (!file.endsWith(".json")) {
      return false
    }

    try {
      return fs.lstatSync(join(dirPath, file)).isFile()
    } catch {
      return false
    }
  })

const resolveFileId = (dirPath: string, file: string): string => {
  const data = readJson(join(dirPath, file))

  return typeof data?.id === "string" ? data.id : file.replace(/\.json$/u, "")
}

// Never builds a path from `id` — avoids path traversal by construction.
const findFileById = (subDir: string, id: string): string | undefined => {
  const dirPath = getPath(subDir)

  if (!fs.existsSync(dirPath)) {
    return undefined
  }

  return listJsonFiles(dirPath).find(
    (file) => resolveFileId(dirPath, file) === id,
  )
}

const requireFileById = (subDir: string, id: string, label: string): string => {
  const file = findFileById(subDir, id)

  if (!file) {
    throw new Error(`${label} "${id}" not found`)
  }

  return file
}

export const initConfig = () => {
  const isConfigFolderExists = fs.existsSync(getPath())

  if (!isConfigFolderExists) {
    fs.mkdirSync(getPath())
  }

  const isGameConfigExists = fs.existsSync(getPath("game.json"))

  if (!isGameConfigExists) {
    fs.writeFileSync(
      getPath("game.json"),
      JSON.stringify(
        {
          managerPassword: "PASSWORD",
        },
        null,
        2,
      ),
    )
  }

  const isQuizzExists = fs.existsSync(getPath("quizz"))

  if (!isQuizzExists) {
    fs.mkdirSync(getPath("quizz"))

    fs.writeFileSync(
      getPath("quizz/example.json"),
      JSON.stringify({ id: nanoid(), ...EXAMPLE_QUIZZ }, null, 2),
    )
  }
}

export const getGameConfig = (): GameConfig => {
  const isExists = fs.existsSync(getPath("game.json"))

  if (!isExists) {
    throw new Error("Game config not found")
  }

  try {
    const config = fs.readFileSync(getPath("game.json"), "utf-8")

    return JSON.parse(config) as GameConfig
  } catch (error) {
    console.error("Failed to read game config:", error)
  }

  return {} as GameConfig
}

export const getQuizzMeta = () =>
  getQuizz().map(({ id, subject }) => ({ id, subject }))

export const getQuizzById = (id: string): QuizzWithId => {
  const quizz = getQuizz().find((q) => q.id === id)

  if (!quizz) {
    throw new Error(`Quizz "${id}" not found`)
  }

  return quizz
}

export const getQuizz = (): QuizzWithId[] => {
  const isExists = fs.existsSync(getPath("quizz"))

  if (!isExists) {
    return []
  }

  try {
    const files = listJsonFiles(getPath("quizz"))

    const quizz: QuizzWithId[] = files.flatMap((file) => {
      const filePath = getPath(`quizz/${file}`)
      const data = readJson(filePath)

      if (!data) {
        console.warn(`Invalid quizz config "${file}": unreadable`)

        return []
      }

      const result = quizzValidator.safeParse(normalizeLegacyQuizz(data))

      if (!result.success) {
        console.warn(`Invalid quizz config "${file}":`, result.error.issues)

        return []
      }

      if (typeof data.id === "string") {
        return [{ id: data.id, ...result.data }]
      }

      const id = nanoid()

      fs.writeFileSync(
        filePath,
        JSON.stringify({ id, ...result.data }, null, 2),
      )

      return [{ id, ...result.data }]
    })

    return quizz
  } catch (error) {
    console.error("Failed to read quizz config:", error)

    return []
  }
}

export const updateQuizz = (id: string, data: unknown): { id: string } => {
  const result = quizzValidator.safeParse(data)

  if (!result.success) {
    throw new Error(result.error.issues[0].message)
  }

  const file = requireFileById("quizz", id, "Quizz")

  fs.writeFileSync(
    join(getPath("quizz"), file),
    JSON.stringify({ id, ...result.data }, null, 2),
  )

  return { id }
}

export const deleteQuizz = (id: string): void => {
  const file = requireFileById("quizz", id, "Quizz")

  fs.unlinkSync(join(getPath("quizz"), file))
}

export const saveResult = (data: GameResult): void => {
  try {
    const resultsPath = getPath("results")

    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath)
    }

    fs.writeFileSync(
      join(resultsPath, `${nanoid()}.json`),
      JSON.stringify(data, null, 2),
    )

    console.log(`Saved result for "${data.subject}"`)
  } catch (error) {
    console.error("Failed to save result:", error)
  }
}

export const getResultsMeta = (): GameResultMeta[] => {
  const resultsPath = getPath("results")

  if (!fs.existsSync(resultsPath)) {
    return []
  }

  const readMeta = (file: string): GameResultMeta | null => {
    const data = readJson(join(resultsPath, file)) as GameResult | null

    if (!data) {
      return null
    }

    try {
      return {
        id: data.id,
        subject: data.subject,
        date: data.date,
        playerCount: data.players.length,
      }
    } catch {
      return null
    }
  }

  try {
    return listJsonFiles(resultsPath)
      .map(readMeta)
      .filter((meta): meta is GameResultMeta => meta !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch {
    return []
  }
}

export const getResultById = (id: string): GameResult => {
  const file = requireFileById("results", id, "Result")
  const data = readJson(join(getPath("results"), file))

  if (!data) {
    throw new Error(`Result "${id}" not found`)
  }

  return data as unknown as GameResult
}

export const deleteResult = (id: string): void => {
  const file = requireFileById("results", id, "Result")

  fs.unlinkSync(join(getPath("results"), file))
}

export const saveQuizz = (data: unknown): { id: string } => {
  const result = quizzValidator.safeParse(data)

  if (!result.success) {
    throw new Error(result.error.issues[0].message)
  }

  const id = nanoid()
  const fileName = normalizeFilename(result.data.subject)

  fs.writeFileSync(
    getPath(`quizz/${fileName}.json`),
    JSON.stringify({ id, ...result.data }, null, 2),
  )

  return { id }
}
