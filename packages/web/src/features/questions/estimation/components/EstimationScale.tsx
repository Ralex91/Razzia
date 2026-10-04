import type { EstimationQuestionOptions } from "@razzia/common/types/game"
import {
  formatValue,
  getRangeRatio,
  toPercent,
} from "@razzia/web/features/questions/estimation/utils"
import type { ReactNode } from "react"

interface Props {
  options: EstimationQuestionOptions
  solution?: number
  start?: ReactNode
  end?: ReactNode
  startLabel?: ReactNode
  endLabel?: ReactNode
  bubble?: ReactNode
  onSolutionChange?: (_value: number) => void
  solutionLabel?: string
}

const EstimationScale = ({
  options,
  solution,
  start,
  end,
  startLabel,
  endLabel,
  bubble,
  onSolutionChange,
  solutionLabel,
}: Props) => {
  const { min, max, margin } = options
  const hasSolution = solution !== undefined

  const solutionRatio = hasSolution ? getRangeRatio(solution, options) : 0
  const marginFrom = hasSolution ? getRangeRatio(solution - margin, options) : 0
  const marginTo = hasSolution ? getRangeRatio(solution + margin, options) : 0

  return (
    <div className="text-muted-foreground grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 text-base font-bold">
      {(startLabel ?? endLabel) && (
        <>
          <div className="col-start-1 mb-1">{startLabel}</div>
          <div className="col-start-3 mb-1">{endLabel}</div>
        </>
      )}

      <div className="col-start-1">
        {start ?? <span>{formatValue(min)}</span>}
      </div>

      <div className="relative h-4 rounded-full bg-gray-200">
        {hasSolution && bubble && (
          <div
            className="absolute bottom-full z-20 mb-5 -translate-x-1/2"
            style={{ left: toPercent(solutionRatio) }}
          >
            {bubble}
            <span className="border-t-correct absolute top-full left-1/2 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent" />
          </div>
        )}

        {hasSolution && (
          <>
            <div
              className="bg-correct/50 absolute inset-y-0 rounded-full"
              style={{
                left: toPercent(marginFrom),
                width: toPercent(marginTo - marginFrom),
              }}
            />
            <span
              className="bg-correct pointer-events-none absolute top-1/2 size-8 -translate-1/2 rounded-full border-4 border-white shadow-md"
              style={{ left: toPercent(solutionRatio) }}
            />
          </>
        )}

        {hasSolution && onSolutionChange && (
          <input
            type="range"
            min={min}
            max={max}
            step={options.step}
            value={solution}
            onChange={(e) => onSolutionChange(Number(e.target.value))}
            aria-label={solutionLabel}
            className="range-overlay absolute inset-x-0 top-1/2 h-8 w-full -translate-y-1/2"
          />
        )}
      </div>

      <div>{end ?? <span>{formatValue(max)}</span>}</div>
    </div>
  )
}

export default EstimationScale
