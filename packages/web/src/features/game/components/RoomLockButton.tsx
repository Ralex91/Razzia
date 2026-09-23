import { EVENTS } from "@razzia/common/constants"
import Tooltip from "@razzia/web/components/Tooltip"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import clsx from "clsx"
import { Lock, LockOpen } from "lucide-react"
import { useTranslation } from "react-i18next"

interface Props {
  className?: string
}

const RoomLockButton = ({ className }: Props) => {
  const { gameId, locked } = useManagerStore()
  const { socket } = useSocket()
  const { t } = useTranslation()

  const handleToggle = () => {
    if (!gameId) {
      return
    }

    socket.emit(EVENTS.MANAGER.SET_LOCK, { gameId, locked: !locked })
  }

  return (
    <Tooltip content={t(locked ? "game:lock.unlock" : "game:lock.lock")}>
      <button
        onClick={handleToggle}
        aria-pressed={locked}
        className={clsx("flex items-center justify-center", className)}
      >
        {locked ? <Lock className="size-5" /> : <LockOpen className="size-5" />}
      </button>
    </Tooltip>
  )
}

export default RoomLockButton
