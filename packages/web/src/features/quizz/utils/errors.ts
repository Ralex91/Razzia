import type { TFunction } from "i18next"

const ERROR_KEY_PREFIX = "errors:"

const FIELD_LABELS: Record<string, string> = {
  maxPoints: "quizz:question.config.maxPoints",
  penalty: "quizz:question.config.penalty",
  cooldown: "quizz:question.config.questionDisplay",
  time: "quizz:question.config.answerTime",
  category: "quizz:question.config.category",
  note: "quizz:question.note",
  type: "quizz:question.config.answerMode",
}

const FIELD_MESSAGES: Record<string, string> = {
  options: "errors:quizz.invalidOptions",
  solutions: "errors:quizz.noSolution",
  media: "errors:quizz.invalidMediaUrl",
}

interface FieldIssue {
  path: string[]
  message: string
}

const collectIssues = (node: unknown, path: string[] = []): FieldIssue[] => {
  if (!node || typeof node !== "object") {
    return []
  }

  const { message, ...children } = node as Record<string, unknown>

  if (typeof message === "string") {
    return [{ path: path.filter((key) => key !== "root"), message }]
  }

  return Object.entries(children)
    .filter(([key]) => !["ref", "type", "types"].includes(key))
    .flatMap(([key, child]) => collectIssues(child, [...path, key]))
}

const toMessage = ({ path, message }: FieldIssue, t: TFunction) => {
  if (message.startsWith(ERROR_KEY_PREFIX)) {
    return t(message)
  }

  const [field] = path

  if (field in FIELD_MESSAGES) {
    return t(FIELD_MESSAGES[field])
  }

  if (field in FIELD_LABELS) {
    return t("errors:quizz.invalidField", { field: t(FIELD_LABELS[field]) })
  }

  return t("errors:quizz.invalidQuestion")
}

export const getErrorMessages = (errors: unknown, t: TFunction): string[] => [
  ...new Set(collectIssues(errors).map((issue) => toMessage(issue, t))),
]
