import * as Switch from "@radix-ui/react-switch"
import { MAX_POINTS, NO_TIME_LIMIT } from "@razzia/common/constants"
import type { ScoringMode } from "@razzia/common/types/game"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@razzia/web/components/Select"
import { QUESTION_REGISTRY } from "@razzia/web/features/questions"
import ConfigField from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigField"
import ConfigNumberInput from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigNumberInput"
import ConfigSection from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigSection"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { ArrowBigDownDash, Clock, ListChecks, Star, Timer } from "lucide-react"
import { useTranslation } from "react-i18next"

const DEFAULT_TIME = 20
const DEFAULT_PENALTY = 100

const BaseConfig = () => {
  const { currentQuestion, currentIndex, updateQuestion } = useQuizzEditor()
  const { t } = useTranslation()
  const isTimeLimitEnabled = currentQuestion.time !== NO_TIME_LIMIT
  const isPenaltyEnabled = (currentQuestion.penalty ?? 0) > 0
  const { scoringModes } = QUESTION_REGISTRY[currentQuestion.type]
  const scoringMode = currentQuestion.options?.scoringMode

  const handleScoringModeChange = (mode: ScoringMode) => {
    updateQuestion(currentIndex, { options: { scoringMode: mode } })
  }

  const handleUpdateQuestion = (key: string) => (value: string | number) => {
    updateQuestion(currentIndex, { [key]: value })
  }

  const handleToggleTimeLimit = (checked: boolean) => {
    updateQuestion(currentIndex, {
      time: checked ? DEFAULT_TIME : NO_TIME_LIMIT,
    })
  }

  const handleTogglePenalty = (checked: boolean) => {
    updateQuestion(currentIndex, {
      penalty: checked ? DEFAULT_PENALTY : undefined,
    })
  }

  const scoringOptions = scoringModes?.map((mode) => ({
    value: mode,
    label: t(`quizz:question.config.scoringMode.${mode}`),
  }))

  return (
    <>
      <ConfigSection title={t("quizz:question.config.scoring")}>
        <ConfigField>
          <ConfigField.Label
            icon={<Star className="size-4" />}
            label={t("quizz:question.config.maxPoints")}
            unit="pts"
          />
          <ConfigNumberInput
            value={currentQuestion.maxPoints ?? MAX_POINTS}
            min={0}
            onChange={handleUpdateQuestion("maxPoints")}
          />
          <ConfigField.Description>
            {t("quizz:question.config.maxPointsHint")}
          </ConfigField.Description>
        </ConfigField>

        <ConfigField>
          <ConfigField.Label
            icon={<ArrowBigDownDash className="size-4" />}
            label={t("quizz:question.config.penalty")}
            unit={isPenaltyEnabled ? "pts" : undefined}
            action={
              <Switch.Root
                checked={isPenaltyEnabled}
                onCheckedChange={handleTogglePenalty}
                className="data-[state=checked]:bg-primary focus-visible:outline-primary bg-accent relative h-5 w-9 cursor-pointer rounded-full transition-colors focus-visible:outline-2"
              >
                <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4.5" />
              </Switch.Root>
            }
          />
          {isPenaltyEnabled && (
            <ConfigNumberInput
              value={currentQuestion.penalty ?? DEFAULT_PENALTY}
              min={1}
              onChange={handleUpdateQuestion("penalty")}
            />
          )}
          <ConfigField.Description>
            {t("quizz:question.config.penaltyHint")}
          </ConfigField.Description>
        </ConfigField>

        {scoringModes && scoringMode && (
          <ConfigField>
            <ConfigField.Label
              icon={<ListChecks className="size-4" />}
              label={t("quizz:question.config.scoringMode")}
            />
            <Select value={scoringMode} onValueChange={handleScoringModeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scoringOptions?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ConfigField.Description>
              {t(`quizz:question.config.scoringModeHint.${scoringMode}`)}
            </ConfigField.Description>
          </ConfigField>
        )}
      </ConfigSection>

      <ConfigSection title={t("quizz:question.config.timings")}>
        <ConfigField>
          <ConfigField.Label
            icon={<Clock className="size-4" />}
            label={t("quizz:question.config.questionDisplay")}
            unit="sec"
          />
          <ConfigNumberInput
            value={currentQuestion.cooldown}
            min={3}
            onChange={handleUpdateQuestion("cooldown")}
          />
          <ConfigField.Description>
            {t("quizz:question.config.questionDisplayHint")}
          </ConfigField.Description>
        </ConfigField>

        <ConfigField>
          <ConfigField.Label
            icon={<Timer className="size-4" />}
            label={t("quizz:question.config.answerTime")}
            unit={isTimeLimitEnabled ? "sec" : undefined}
            action={
              <Switch.Root
                checked={isTimeLimitEnabled}
                onCheckedChange={handleToggleTimeLimit}
                className="data-[state=checked]:bg-primary focus-visible:outline-primary bg-accent relative h-5 w-9 cursor-pointer rounded-full transition-colors focus-visible:outline-2"
              >
                <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4.5" />
              </Switch.Root>
            }
          />
          {isTimeLimitEnabled && (
            <ConfigNumberInput
              value={currentQuestion.time}
              min={5}
              onChange={handleUpdateQuestion("time")}
            />
          )}
          <ConfigField.Description>
            {isTimeLimitEnabled
              ? t("quizz:question.config.answerTimeHint")
              : t("quizz:question.config.noTimeLimitHint")}
          </ConfigField.Description>
        </ConfigField>
      </ConfigSection>
    </>
  )
}

export default BaseConfig
