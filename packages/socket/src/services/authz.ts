import type { Permission, User } from "@razzia/common/types/user"
import { quizzesRepo, resultsRepo, sharesRepo } from "@razzia/socket/db/repositories"

export class AuthzError extends Error {}

const RANK: Record<Permission, number> = { view: 0, run: 1, edit: 2 }

const isAdmin = (user: User) => user.role === "admin"

/**
 * Effective permission a user has on a quiz:
 * admin -> "edit" everywhere; owner -> "edit"; otherwise the shared grant.
 */
export const effectivePermission = (
  user: User,
  quizId: string,
): Permission | null => {
  if (isAdmin(user)) {
    return "edit"
  }

  const quiz = quizzesRepo.byId(quizId)

  if (!quiz) {
    return null
  }

  if (quiz.ownerId === user.id) {
    return "edit"
  }

  return sharesRepo.permissionFor(quizId, user.id)
}

const has = (user: User, quizId: string, needed: Permission): boolean => {
  const perm = effectivePermission(user, quizId)

  return perm !== null && RANK[perm] >= RANK[needed]
}

export const assertCanView = (user: User, quizId: string) => {
  if (!has(user, quizId, "view")) {
    throw new AuthzError("errors:authz.forbidden")
  }
}

export const assertCanRun = (user: User, quizId: string) => {
  if (!has(user, quizId, "run")) {
    throw new AuthzError("errors:authz.forbidden")
  }
}

export const assertCanEdit = (user: User, quizId: string) => {
  if (!has(user, quizId, "edit")) {
    throw new AuthzError("errors:authz.forbidden")
  }
}

/** Only the owner or an admin may delete or (re)share a quiz. */
export const assertIsOwnerOrAdmin = (user: User, quizId: string) => {
  if (isAdmin(user)) {
    return
  }

  const quiz = quizzesRepo.byId(quizId)

  if (!quiz || quiz.ownerId !== user.id) {
    throw new AuthzError("errors:authz.forbidden")
  }
}

export const assertIsAdmin = (user: User) => {
  if (!isAdmin(user)) {
    throw new AuthzError("errors:authz.adminOnly")
  }
}

export const assertCanViewResult = (user: User, resultId: string) => {
  if (isAdmin(user)) {
    return
  }

  const result = resultsRepo.byId(resultId)

  if (!result || result.ownerId !== user.id) {
    throw new AuthzError("errors:authz.forbidden")
  }
}
