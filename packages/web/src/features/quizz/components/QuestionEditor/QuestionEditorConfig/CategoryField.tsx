import Combobox from "@razzia/web/components/Combobox"
import ConfigField from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigField"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { Tag } from "lucide-react"
import { useTranslation } from "react-i18next"

const CategoryField = () => {
  const { questions, currentQuestion, currentIndex, updateQuestion } =
    useQuizzEditor()
  const { t } = useTranslation()

  const categories = [
    ...new Set(
      questions
        .map((question) => question.category?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ]

  const handleChange = (value: string) => {
    updateQuestion(currentIndex, { category: value || undefined })
  }

  return (
    <ConfigField>
      <ConfigField.Label
        icon={<Tag className="size-4" />}
        label={t("quizz:question.config.category")}
      />
      <Combobox
        variant="sm"
        value={currentQuestion.category ?? ""}
        onValueChange={handleChange}
        options={categories}
        placeholder={t("quizz:question.config.categoryPlaceholder")}
        className="w-full"
      />
      <ConfigField.Description>
        {t("quizz:question.config.categoryHint")}
      </ConfigField.Description>
    </ConfigField>
  )
}

export default CategoryField
