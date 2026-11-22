import { useEffect, useState } from "react"
import useSound from "use-sound"
import type { QuestionMediaType } from "@razzia/common/types/game"
import type { Status } from "@razzia/web/features/game/utils/createStatus"
import { MEDIA_TYPES } from "@razzia/common/constants"
import { STATUS, type StatusDataMap } from "@razzia/common/types/game/status"
import { SFX } from "@razzia/web/features/game/utils/constants"

const MUTED_MEDIA: QuestionMediaType[] = [MEDIA_TYPES.AUDIO, MEDIA_TYPES.VIDEO]

const WAITING_FOR_ANSWERS = "game:waitingForAnswers"

const nextMusicState = (
  status: Status<StatusDataMap> | null,
  isPlaying: boolean,
) => {
  if (status?.name === STATUS.SELECT_ANSWER) {
    return !MUTED_MEDIA.includes(status.data.media?.type)
  }

  if (
    status?.name === STATUS.WAIT &&
    status.data.text === WAITING_FOR_ANSWERS
  ) {
    return isPlaying
  }

  return false
}

export const useAnswersMusic = (status: Status<StatusDataMap> | null) => {
  const [trackedStatus, setTrackedStatus] = useState(status)
  const [isPlaying, setIsPlaying] = useState(() =>
    nextMusicState(status, false),
  )

  if (status !== trackedStatus) {
    setTrackedStatus(status)
    setIsPlaying(nextMusicState(status, isPlaying))
  }

  const [playMusic, { stop: stopMusic }] = useSound(SFX.ANSWERS.MUSIC, {
    volume: 0.2,
    interrupt: true,
    loop: true,
  })

  useEffect(() => {
    if (!isPlaying) {
      return
    }

    playMusic()

    return () => {
      stopMusic()
    }
  }, [isPlaying, playMusic, stopMusic])
}
