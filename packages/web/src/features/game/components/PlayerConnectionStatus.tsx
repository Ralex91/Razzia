import Tooltip from "@razzia/web/components/Tooltip"
import clsx from "clsx"
import { Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

const CLOSED_DELAY_MS = 10_000
const LOST_AFTER_MS = 60_000

interface Props {
  timedOut?: boolean
}

// Rendered only while the player is disconnected, so every drop starts at zero
// (also after the manager reloads the page). A timed out connection was
// already silent for a while when the server noticed it, so the clock shows
// at once; a closed one (often a page reload) gets 10 s to come back first.
// One minute after the clock it turns red, and `data-lost` lets the tile dim.
const PlayerConnectionStatus = ({ timedOut = false }: Props) => {
  const [stage, setStage] = useState<"none" | "reconnecting" | "lost">(
    timedOut ? "reconnecting" : "none",
  )
  const { t } = useTranslation()

  useEffect(() => {
    const clockAt = timedOut ? 0 : CLOSED_DELAY_MS
    const reconnecting = setTimeout(() => setStage("reconnecting"), clockAt)
    const lost = setTimeout(() => setStage("lost"), clockAt + LOST_AFTER_MS)

    return () => {
      clearTimeout(reconnecting)
      clearTimeout(lost)
    }
  }, [timedOut])

  if (stage === "none") {
    return null
  }

  const label = t(
    stage === "lost" ? "game:playerConnectionLost" : "game:playerReconnecting",
  )

  return (
    <Tooltip content={label}>
      <span
        role="img"
        aria-label={label}
        data-lost={stage === "lost" || undefined}
        className="absolute -top-1.5 -right-1.5 flex"
        onClick={(event) => event.stopPropagation()}
      >
        <span
          className={clsx(
            "rounded-full bg-white p-0.5 shadow",
            stage === "lost" ? "text-red-500" : "text-primary",
          )}
        >
          <Clock className="size-4" />
        </span>
      </span>
    </Tooltip>
  )
}

export default PlayerConnectionStatus
