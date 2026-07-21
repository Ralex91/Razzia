import type { Question, QuestionType } from "@razzia/common/types/game"
import * as multi from "./multi"
import * as order from "./order"
import * as single from "./single"
import * as text from "./text"

export type ScoringFn = (_question: Question, _answerIds: number[]) => number

export const QUESTION_SCORING: Record<QuestionType, ScoringFn> = {
  [single.type]: single.scoring,
  [multi.type]: multi.scoring,
  [order.type]: order.scoring,
  [text.type]: text.scoring,
}
