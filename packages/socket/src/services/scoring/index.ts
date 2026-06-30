import type { Question, QuestionType } from "@razzia/common/types/game"
import * as multi from "./multi"
import * as single from "./single"

export type ScoringFn = (_question: Question, _answerIds: number[]) => number

export const QUESTION_SCORING: Record<QuestionType, ScoringFn> = {
  [single.type]: single.scoring,
  [multi.type]: multi.scoring,
}
