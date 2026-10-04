import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { useTranslation } from "react-i18next"

interface Props {
  data: CommonStatusDataMap["FINISHED"]
}

const PlayerFinished = ({ data: { rank, subject } }: Props) => {
  const { player } = usePlayerStore()
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 px-4">
      <p className="text-center text-4xl font-bold text-white drop-shadow-lg md:text-5xl">
        {subject}
      </p>

      <p className="text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl">
        {typeof rank === "number"
          ? t("game:rank", { count: rank, ordinal: true })
          : "—"}
      </p>

      <p className="mt-2 rounded bg-black/40 px-6 py-2 text-2xl font-bold text-white">
        {player?.points ?? 0} pts
      </p>
    </div>
  )
}

export default PlayerFinished
