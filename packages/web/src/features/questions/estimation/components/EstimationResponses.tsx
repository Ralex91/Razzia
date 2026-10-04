import { estimationAccuracy } from "@razzia/common/questions/estimation"
import {
  formatValue,
  getEstimationOptions,
  getRangeRatio,
  toPercent,
} from "@razzia/web/features/questions/estimation/utils"
import type { ResponsesComponentProps } from "@razzia/web/features/questions/types"
import clsx from "clsx"
import { Check, Users } from "lucide-react"

const BADGE_CLASS =
  "text-foreground rounded-xl bg-white px-4 py-1.5 text-2xl font-bold shadow-md"

const BADGE_BOUNDS = { MIN: 0.08, MAX: 0.92 }

const clampBadge = (ratio: number) =>
  toPercent(Math.min(BADGE_BOUNDS.MAX, Math.max(BADGE_BOUNDS.MIN, ratio)))

const EstimationResponses = ({
  data: { responses, solutions, options },
}: ResponsesComponentProps) => {
  const estimation = getEstimationOptions(options)
  const { min, max, margin } = estimation
  const solution = solutions?.at(0)

  if (solution === undefined) {
    return null
  }

  const rangeFrom = Math.max(min, solution - margin)
  const rangeTo = Math.min(max, solution + margin)
  const fromRatio = getRangeRatio(rangeFrom, estimation)
  const toRatio = getRangeRatio(rangeTo, estimation)

  const inRangeCount = Object.entries(responses).reduce(
    (acc, [value, count]) =>
      estimationAccuracy(Number(value), solution, margin) > 0
        ? acc + count
        : acc,
    0,
  )

  return (
    <div className="mx-auto mt-8 w-full max-w-4xl px-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4">
        <div className="relative col-start-2 h-20">
          <div
            className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center rounded-xl bg-white px-4 py-1.5 whitespace-nowrap shadow-lg"
            style={{ left: clampBadge((fromRatio + toRatio) / 2) }}
          >
            <span className="text-correct flex items-center gap-2 text-3xl font-bold">
              <Users className="size-7 stroke-3" />
              {inRangeCount}
            </span>
            <span className="text-muted-foreground text-sm font-bold">
              {formatValue(rangeFrom)} – {formatValue(rangeTo)}
            </span>
          </div>
        </div>

        <span className={clsx(BADGE_CLASS, "col-start-1")}>
          {formatValue(min)}
        </span>
        <div className="relative h-4 rounded-full bg-white/90 shadow-md">
          <div
            className="bg-correct/70 absolute inset-y-0 rounded-full"
            style={{
              left: toPercent(fromRatio),
              right: toPercent(1 - toRatio),
            }}
          />
          <span
            className="bg-correct absolute top-1/2 size-10 -translate-1/2 rounded-full border-4 border-white shadow-lg"
            style={{ left: toPercent(getRangeRatio(solution, estimation)) }}
          />
        </div>
        <span className={BADGE_CLASS}>{formatValue(max)}</span>

        <div className="relative col-start-2 h-12">
          <span
            className="bg-correct absolute top-1 flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-1.5 text-2xl font-bold whitespace-nowrap text-white shadow-lg"
            style={{ left: clampBadge(getRangeRatio(solution, estimation)) }}
          >
            <Check className="size-6 stroke-4" />
            {formatValue(solution)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default EstimationResponses
