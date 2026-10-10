import type { EstimationInputMode } from "@razzia/common/types/game"
import { ESTIMATION_INPUT_MODES, QUIZZ_MODES } from "@razzia/common/constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@razzia/web/components/Select"
import { getEstimationOptions } from "@razzia/web/features/questions/estimation/utils"
import BaseConfig from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/BaseConfig"
import ConfigField from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigField"
import ConfigNumberInput from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigNumberInput"
import ConfigSection from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigSection"
import {
  useQuizzEditor,
  type QuizzFormValues,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { Crosshair, Footprints, SlidersHorizontal } from "lucide-react"
import { useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

const EstimationConfig = () => {
  const {
    currentQuestion,
    currentIndex,
    gameMode,
    updateQuestion,
    questionPath,
  } = useQuizzEditor()
  const {
    trigger,
    formState: { isSubmitted },
  } = useFormContext<QuizzFormValues>()
  const { t } = useTranslation()
  const options = getEstimationOptions(currentQuestion.options)

  useEffect(() => {
    if (!isSubmitted) {
      return
    }

    void trigger([questionPath("options.max"), questionPath("solutions")])
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [options.min, options.max])

  const handleInputModeChange = (inputMode: EstimationInputMode) => {
    updateQuestion(currentIndex, { options: { ...options, inputMode } })
  }

  return (
    <>
      <ConfigSection title={t("quizz:question.config.estimation.title")}>
        <ConfigField>
          <ConfigField.Label
            icon={<SlidersHorizontal className="size-4" />}
            label={t("quizz:question.config.estimation.inputMode")}
          />
          <Select
            value={options.inputMode}
            onValueChange={handleInputModeChange}
          >
            <SelectTrigger
              aria-label={t("quizz:question.config.estimation.inputMode")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ESTIMATION_INPUT_MODES).map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {t(`quizz:question.config.estimation.inputModes.${mode}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ConfigField.Description>
            {t(
              `quizz:question.config.estimation.inputModeHint.${options.inputMode}`,
            )}
          </ConfigField.Description>
        </ConfigField>

        <ConfigField>
          <ConfigField.Label
            icon={<Footprints className="size-4" />}
            label={t("quizz:question.config.estimation.step")}
          />
          <ConfigNumberInput
            name="options.step"
            label={t("quizz:question.config.estimation.step")}
          />
          <ConfigField.Description>
            {t("quizz:question.config.estimation.stepHint")}
          </ConfigField.Description>
        </ConfigField>

        {gameMode !== QUIZZ_MODES.SURVEY && (
          <ConfigField>
            <ConfigField.Label
              icon={<Crosshair className="size-4" />}
              label={t("quizz:question.config.estimation.margin")}
            />
            <ConfigNumberInput
              name="options.margin"
              label={t("quizz:question.config.estimation.margin")}
              min={0}
            />
            <ConfigField.Description>
              {t("quizz:question.config.estimation.marginHint")}
            </ConfigField.Description>
          </ConfigField>
        )}
      </ConfigSection>

      <BaseConfig />
    </>
  )
}

export default EstimationConfig
