import type { QuizzMeta } from "@razzia/common/types/game"

export type Perm = NonNullable<QuizzMeta["permission"]>

const RANK: Record<Perm, number> = { view: 1, run: 2, edit: 3, owner: 4 }

/** Legacy quizzes without annotations are treated as owned. */
export const permOf = (quizz: Pick<QuizzMeta, "permission">): Perm =>
  quizz.permission ?? "owner"

export const can = (quizz: Pick<QuizzMeta, "permission">, need: Perm): boolean =>
  RANK[permOf(quizz)] >= RANK[need]

export const isOwner = (quizz: Pick<QuizzMeta, "permission">): boolean =>
  permOf(quizz) === "owner"
