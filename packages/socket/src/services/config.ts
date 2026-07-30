import type {
  GameResult,
  GameResultMeta,
  QuizzMeta,
  QuizzWithId,
} from "@razzia/common/types/game"
import type { User } from "@razzia/common/types/user"
import { quizzValidator } from "@razzia/common/validators/quizz"
import {
  quizzesRepo,
  resultsRepo,
  usersRepo,
} from "@razzia/socket/db/repositories"
import {
  assertCanEdit,
  assertCanView,
  assertCanViewResult,
  assertIsOwnerOrAdmin,
} from "@razzia/socket/services/authz"
import fs from "fs"
import { nanoid } from "nanoid"
import { resolve } from "path"

const inContainerPath = process.env.CONFIG_PATH
const getPath = (path = "") =>
  inContainerPath
    ? resolve(inContainerPath, path)
    : resolve(process.cwd(), "../../config", path)

/** Ensures the config dir exists and warns about the obsolete password config. */
export const initConfig = () => {
  if (!fs.existsSync(getPath())) {
    fs.mkdirSync(getPath(), { recursive: true })
  }

  if (fs.existsSync(getPath("game.json"))) {
    console.warn(
      "config/game.json is obsolete: manager auth now uses passkeys. " +
        "The managerPassword field is ignored.",
    )
  }
}

const toQuizzWithId = (row: {
  id: string
  subject: string
  data: unknown
}): QuizzWithId => ({
  id: row.id,
  subject: row.subject,
  questions: (row.data as { questions: QuizzWithId["questions"] }).questions,
})

/* ------------------------------ Quizzes ---------------------------- */

/** Quiz list scoped to the viewer: admins see all, managers see owned+shared. */
export const getQuizzMeta = (user: User): QuizzMeta[] => {
  const nameCache = new Map<string, string>()
  const ownerName = (ownerId: string): string => {
    if (!nameCache.has(ownerId)) {
      nameCache.set(ownerId, usersRepo.byId(ownerId)?.displayName ?? "unknown")
    }

    return nameCache.get(ownerId) as string
  }

  if (user.role === "admin") {
    return quizzesRepo.listAll().map((q) => ({
      id: q.id,
      subject: q.subject,
      ownerId: q.ownerId,
      ownerName: ownerName(q.ownerId),
      shared: false,
      permission: "edit",
    }))
  }

  return quizzesRepo.listForUser(user.id).map((q) => ({
    id: q.id,
    subject: q.subject,
    ownerId: q.ownerId,
    ownerName: ownerName(q.ownerId),
    shared: q.permission !== "owner",
    permission: q.permission,
  }))
}

export const getQuizzById = (id: string, user: User): QuizzWithId => {
  assertCanView(user, id)

  const quizz = quizzesRepo.byId(id)

  if (!quizz) {
    throw new Error(`Quizz "${id}" not found`)
  }

  return { ...toQuizzWithId(quizz), ownerId: quizz.ownerId }
}

export const saveQuizz = (data: unknown, ownerId: string): { id: string } => {
  const result = quizzValidator.safeParse(data)

  if (!result.success) {
    throw new Error(result.error.issues[0].message)
  }

  return quizzesRepo.create({
    ownerId,
    subject: result.data.subject,
    data: { questions: result.data.questions },
  })
}

export const updateQuizz = (
  id: string,
  data: unknown,
  user: User,
): { id: string } => {
  assertCanEdit(user, id)

  const result = quizzValidator.safeParse(data)

  if (!result.success) {
    throw new Error(result.error.issues[0].message)
  }

  quizzesRepo.update(id, {
    subject: result.data.subject,
    data: { questions: result.data.questions },
  })

  return { id }
}

export const deleteQuizz = (id: string, user: User): void => {
  assertIsOwnerOrAdmin(user, id)
  quizzesRepo.delete(id)
}

/** Clone a quiz the user can at least view into a new quiz they own. */
export const cloneQuizz = (id: string, user: User): { id: string } => {
  assertCanView(user, id)

  const source = quizzesRepo.byId(id)

  if (!source) {
    throw new Error(`Quizz "${id}" not found`)
  }

  return quizzesRepo.create({
    ownerId: user.id,
    subject: `${source.subject} (copy)`,
    data: source.data,
  })
}

/* ------------------------------ Results ---------------------------- */

export const saveResult = (data: GameResult, ownerId: string, quizId: string | null) => {
  try {
    resultsRepo.create({
      id: data.id,
      quizId,
      ownerId,
      subject: data.subject,
      date: data.date,
      data,
    })

    console.log(`Saved result for "${data.subject}"`)
  } catch (error) {
    console.error("Failed to save result:", error)
  }
}

export const getResultsMeta = (user: User): GameResultMeta[] => {
  const rows =
    user.role === "admin"
      ? resultsRepo.listAll()
      : resultsRepo.listForOwner(user.id)

  return rows.map((r) => {
    const full = resultsRepo.byId(r.id)?.data as GameResult | undefined

    return {
      id: r.id,
      subject: r.subject,
      date: r.date,
      playerCount: full?.players.length ?? 0,
    }
  })
}

export const getResultById = (id: string, user: User): GameResult => {
  assertCanViewResult(user, id)

  const result = resultsRepo.byId(id)

  if (!result) {
    throw new Error(`Result "${id}" not found`)
  }

  return result.data as GameResult
}

export const deleteResult = (id: string, user: User): void => {
  assertCanViewResult(user, id)
  resultsRepo.delete(id)
}
