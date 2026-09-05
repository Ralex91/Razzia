import { EVENTS, isPlayableMedia } from "@razzia/common/constants"
import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import QuestionMedia from "@razzia/web/components/QuestionMedia"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import { SFX } from "@razzia/web/features/game/utils/constants"
import { useEffect } from "react"
import useSound from "use-sound"

interface Props {
  data: CommonStatusDataMap["SHOW_QUESTION"]
}

const Question = ({
  data: { question, media, cooldown, questionIndex },
}: Props) => {
  const { socket } = useSocket()
  const { gameId: managerGameId } = useManagerStore()
  const [sfxShow] = useSound(SFX.SHOW_SOUND, { volume: 0.5 })

  const playableMedia = isPlayableMedia(media?.type)

  useEffect(() => {
    // The audio/video plays its own sound; the show SFX would clash with it.
    if (playableMedia) {
      return
    }

    sfxShow()
  }, [sfxShow, playableMedia])

  const handleEnded = () => {
    if (!managerGameId) {
      return
    }

    socket.emit(EVENTS.MANAGER.MEDIA_ENDED, {
      gameId: managerGameId,
      questionIndex,
    })
  }

  return (
    <section className="relative mx-auto flex h-full w-full max-w-7xl flex-1 flex-col items-center px-4">
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <h2 className="anim-show text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
          {question}
        </h2>

        <QuestionMedia
          media={media}
          alt={question}
          autoPlay={playableMedia}
          onEnded={handleEnded}
        />
      </div>

      {!playableMedia && (
        <div
          className="bg-primary mb-20 h-4 self-start justify-self-end rounded-full"
          style={{ animation: `progressBar ${cooldown}s linear forwards` }}
        ></div>
      )}
    </section>
  )
}

export default Question
