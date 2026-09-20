import { EVENTS, QUIZZ_MODES } from "@razzia/common/constants"
import {
  STATUS,
  type Status,
  type StatusDataMap,
} from "@razzia/common/types/game/status"
import Button from "@razzia/web/components/Button"
import GameBackground from "@razzia/web/components/GameBackground"
import Loader from "@razzia/web/components/Loader"
import Tooltip from "@razzia/web/components/Tooltip"
import GameSettingsModal from "@razzia/web/features/game/components/GameSettingsModal"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { useQuestionStore } from "@razzia/web/features/game/stores/question"
import { MANAGER_SKIP_BTN } from "@razzia/web/features/game/utils/constants"
import type { Status as GameStatus } from "@razzia/web/features/game/utils/createStatus"
import { useFullscreen } from "@razzia/web/hooks/useFullscreen"
import clsx from "clsx"
import { Maximize, Minimize, Users } from "lucide-react"
import { type PropsWithChildren, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

type Props = PropsWithChildren & {
  statusName: Status | undefined
  onNext?: () => void
  onBack?: () => void
  manager?: boolean
}

const GameWrapper = ({
  children,
  statusName,
  onNext,
  onBack,
  manager,
}: Props) => {
  const { isConnected } = useSocket()
  const { player, gameMode } = usePlayerStore()
  const { players, inviteCode, status } = useManagerStore()
  const { questionStates, setQuestionStates } = useQuestionStore()
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
  const { t } = useTranslation()
  const [skippedStatus, setSkippedStatus] =
    useState<GameStatus<StatusDataMap> | null>(null)
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<{
    seconds: number
    total: number
  } | null>(null)
  const next = statusName ? MANAGER_SKIP_BTN[statusName] : null
  const isDisabled = skippedStatus !== null && skippedStatus === status

  useEvent(EVENTS.GAME.UPDATE_QUESTION, ({ current, total }) => {
    setQuestionStates({
      current,
      total,
    })
  })

  useEvent(EVENTS.GAME.TOTAL_PLAYERS, (total) => {
    setTotalPlayers(total)
  })

  useEvent(EVENTS.MANAGER.AUTO_ADVANCE, (state) => {
    setCountdown((current) => {
      if (state === null) {
        return null
      }

      return current ?? state
    })
  })

  useEvent(EVENTS.GAME.ERROR_MESSAGE, (message) => {
    toast.error(t(message))
    console.log(t(message))
    setSkippedStatus(null)
  })

  const handleNext = () => {
    setSkippedStatus(status)
    onNext?.()
  }

  return (
    <section className="relative flex min-h-dvh">
      <GameBackground />

      <div className="z-10 flex w-full flex-1 flex-col justify-between">
        {!isConnected && !statusName ? (
          <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
            <Loader className="h-30" />
            <h1 className="text-4xl font-bold text-white">
              {t("common:connecting")}
            </h1>
          </div>
        ) : (
          <>
            <div className="flex w-full justify-between p-4">
              {questionStates && (
                <div className="flex items-center rounded-md bg-white p-2 px-4 text-lg font-bold text-black">
                  {`${questionStates.current} / ${questionStates.total}`}
                </div>
              )}

              {manager && next && (
                <Button
                  className={clsx(
                    "hover:bg-accent relative overflow-hidden bg-white px-4 text-black",
                    { "pointer-events-none": isDisabled },
                  )}
                  onClick={handleNext}
                >
                  {countdown && (
                    <span
                      className="bg-primary/40 absolute inset-y-0 left-0"
                      style={{
                        animation: `progressBar ${countdown.total}s linear forwards`,
                      }}
                    />
                  )}

                  <span className="relative">{t(next)}</span>
                </Button>
              )}

              {manager && onBack && (
                <Button
                  onClick={onBack}
                  className="hover:bg-accent bg-white px-4 text-black"
                >
                  {t("common:exit")}
                </Button>
              )}
            </div>

            {children}

            {manager ? (
              <div
                className={clsx("z-50 flex items-stretch gap-3 p-4", {
                  "absolute inset-x-0 bottom-0": statusName === STATUS.FINISHED,
                })}
              >
                {inviteCode && statusName !== STATUS.SHOW_ROOM && (
                  <div className="flex items-center gap-3 rounded-lg bg-black/40 px-3 py-1.5 text-xl font-bold text-white drop-shadow-md">
                    <span>{window.location.host}</span>
                    <span className="h-5 w-px bg-white/40" />
                    <span>{inviteCode}</span>
                  </div>
                )}

                <Tooltip content={t("game:playersJoined")}>
                  <div className="ml-auto flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1.5 text-xl font-bold text-white drop-shadow-md">
                    <Users className="size-5" />
                    {totalPlayers ?? players.length}
                  </div>
                </Tooltip>

                {statusName === STATUS.SHOW_ROOM && <GameSettingsModal />}

                <Tooltip
                  content={t(
                    isFullscreen
                      ? "common:exitFullscreen"
                      : "common:fullscreen",
                  )}
                >
                  <button
                    onClick={toggleFullscreen}
                    className="flex items-center justify-center rounded-lg bg-black/40 px-2.5 text-white drop-shadow-md hover:bg-black/60"
                  >
                    {isFullscreen ? (
                      <Minimize className="size-5" />
                    ) : (
                      <Maximize className="size-5" />
                    )}
                  </button>
                </Tooltip>
              </div>
            ) : (
              <div className="z-50 flex items-center justify-between bg-white px-4 py-2 text-lg font-bold text-white">
                <p className="text-gray-800">{player?.username}</p>
                {gameMode !== QUIZZ_MODES.SURVEY && (
                  <div className="rounded-lg bg-gray-800 px-3 py-1 text-lg">
                    {player?.points}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default GameWrapper
