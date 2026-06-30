import type { QuestionType } from "@razzia/common/types/game"
import {
  QUESTION_REGISTRY,
  QUESTION_TYPE_LIST,
} from "@razzia/web/features/questions"
import ConfigField from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigField"
import ConfigSelect from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigSelect"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { LayoutList } from "lucide-react"
import { useTranslation } from "react-i18next"

const QuestionEditorConfig = () => {
  const { currentQuestion, currentIndex, updateQuestion } = useQuizzEditor()
  const { t } = useTranslation()
  const questionType = currentQuestion.type

  const handleTypeChange = (nextType: QuestionType) => {
    updateQuestion(currentIndex, {
      type: nextType,
      options: QUESTION_REGISTRY[nextType].defaultOptions,
    })
  }

  const { ConfigComponent } = QUESTION_REGISTRY[questionType]

  const typeOptions = QUESTION_TYPE_LIST.map((type) => ({
    value: type,
    label: t(QUESTION_REGISTRY[type].labelKey),
  }))

  return (
    <aside className="z-10 m-3 flex w-68 shrink-0 flex-col gap-6 self-start overflow-auto rounded-xl bg-white p-4 shadow-sm">
      <ConfigField>
        <ConfigField.Label
          icon={<LayoutList className="size-4" />}
          label={t("quizz:question.config.answerMode")}
        />
        <ConfigSelect
          value={questionType}
          options={typeOptions}
          onValueChange={handleTypeChange}
        />
      </ConfigField>

      <ConfigComponent />
    </aside>
  )
}

export default QuestionEditorConfig
