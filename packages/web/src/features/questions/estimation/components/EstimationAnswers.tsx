import { ESTIMATION_INPUT_MODES } from "@razzia/common/constants"
import Button from "@razzia/web/components/Button"
import Input from "@razzia/web/components/Input"
import {
  formatValue,
  getEstimationOptions,
  getRangeRatio,
  snapToStep,
} from "@razzia/web/features/questions/estimation/utils"
import type { AnswerComponentProps } from "@razzia/web/features/questions/types"
import clsx from "clsx"
import { useState, type CSSProperties } from "react"
import { useTranslation } from "react-i18next"

const BADGE_CLASS =
  "text-foreground rounded-md bg-white px-2 py-0.5 font-bold shadow-md"

const EstimationAnswers = ({
  options,
  onSubmit,
  readOnly,
  fill,
}: AnswerComponentProps) => {
  const estimation = getEstimationOptions(options)
  const { min, max, step, inputMode } = estimation
  const isSlider = inputMode === ESTIMATION_INPUT_MODES.SLIDER
  const { t } = useTranslation()

  const [value, setValue] = useState(() =>
    snapToStep((min + max) / 2, estimation),
  )
  const [input, setInput] = useState("")

  const inputValue = input.trim() === "" ? NaN : Number(input)
  const isInputValid =
    Number.isFinite(inputValue) && inputValue >= min && inputValue <= max
  const canSubmit = isSlider || isInputValid

  const rangeHint = t("game:estimation.rangeHint", {
    min: formatValue(min),
    max: formatValue(max),
  })

  const handleSubmit = () => {
    if (!canSubmit) {
      return
    }

    onSubmit([isSlider ? value : inputValue])
  }

  if (readOnly) {
    return (
      <div className="mx-auto mb-6 flex w-full max-w-7xl flex-col gap-3 px-2 pt-6">
        <div className="relative h-4 rounded-full bg-white/90 shadow-md">
          <div className="anim-slider-fill-slow bg-primary absolute inset-y-0 left-0 rounded-full" />
          <div className="anim-slider-thumb-slow bg-primary absolute top-1/2 size-11 -translate-1/2 rounded-full border-5 border-white shadow-lg" />
        </div>
        <div className="flex justify-between">
          <span className={clsx(BADGE_CLASS, "text-lg")}>
            {formatValue(min)}
          </span>
          <span className={clsx(BADGE_CLASS, "text-lg")}>
            {formatValue(max)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={clsx("mx-auto mb-4 flex w-full flex-col px-2", {
        "flex-1 justify-center": fill,
        "max-w-7xl": isSlider,
        "max-w-2xl": !isSlider,
      })}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="flex flex-col gap-4"
      >
        {isSlider ? (
          <>
            <output className="text-foreground mx-auto min-w-24 rounded-xl bg-white px-4 py-1 text-center text-3xl font-bold shadow-md">
              {formatValue(value)}
            </output>
            <div className="flex flex-col gap-3 pt-3">
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                aria-label={t("game:estimation.yourAnswer")}
                className="range-slider w-full"
                style={
                  {
                    "--progress": `${getRangeRatio(value, estimation) * 100}%`,
                  } as CSSProperties
                }
              />
              <div className="flex justify-between">
                <span className={clsx(BADGE_CLASS, "text-sm")}>
                  {formatValue(min)}
                </span>
                <span className={clsx(BADGE_CLASS, "text-sm")}>
                  {formatValue(max)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <p className={clsx(BADGE_CLASS, "mx-auto mb-1 text-sm")}>
              {rangeHint}
            </p>
            <Input
              type="number"
              inputMode="decimal"
              min={min}
              max={max}
              step={step}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("game:estimation.yourAnswer")}
              aria-label={t("game:estimation.yourAnswer")}
              autoFocus
              className="mx-auto w-full max-w-sm bg-white text-center shadow-md"
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="mx-auto w-full max-w-xs shadow-md"
        >
          {t("game:confirm")}
        </Button>
      </form>
    </div>
  )
}

export default EstimationAnswers
