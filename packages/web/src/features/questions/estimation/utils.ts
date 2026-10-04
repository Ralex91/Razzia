import { ESTIMATION_INPUT_MODES } from "@razzia/common/constants"
import { isEstimationOptions } from "@razzia/common/questions/options"
import type {
  EstimationQuestionOptions,
  QuestionOptions,
} from "@razzia/common/types/game"

export const createDefaultEstimationOptions =
  (): EstimationQuestionOptions => ({
    inputMode: ESTIMATION_INPUT_MODES.SLIDER,
    min: 0,
    max: 100,
    step: 1,
    margin: 10,
  })

export const getEstimationOptions = (
  options?: QuestionOptions,
): EstimationQuestionOptions =>
  isEstimationOptions(options) ? options : createDefaultEstimationOptions()

const countDecimals = (value: number) =>
  (String(value).split(".")[1] ?? "").length

export const snapToStep = (
  value: number,
  { min, max, step }: EstimationQuestionOptions,
): number => {
  const decimals = Math.max(countDecimals(min), countDecimals(step))
  const snapped = min + Math.round((value - min) / step) * step

  return Number(Math.min(max, Math.max(min, snapped)).toFixed(decimals))
}

export const getRangeRatio = (
  value: number,
  { min, max }: EstimationQuestionOptions,
): number => {
  if (max <= min) {
    return 0
  }

  return Math.min(1, Math.max(0, (value - min) / (max - min)))
}

export const toPercent = (ratio: number) => `${ratio * 100}%`

export const formatValue = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 4 })
