import clsx from "clsx"
import { useState } from "react"
import useSound from "use-sound"
import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import { EVENTS } from "@razzia/common/constants"
import { useEvent } from "@razzia/web/features/game/contexts/socket-context"
import { SFX } from "@razzia/web/features/game/utils/constants"

interface Props {
  data: CommonStatusDataMap["SHOW_START"]
}

const Start = ({ data: { time, subject } }: Props) => {
  const [showTitle, setShowTitle] = useState(true)
  const [cooldown, setCooldown] = useState(time)

  const [sfxBoump] = useSound(SFX.BOUMP_SOUND, {
    volume: 0.2,
  })

  useEvent(EVENTS.GAME.START_COOLDOWN, () => {
    sfxBoump()
    setShowTitle(false)
  })

  useEvent(EVENTS.GAME.COOLDOWN, (sec) => {
    sfxBoump()
    setCooldown(sec)
  })

  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center">
      {showTitle ? (
        <h2 className="anim-show text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
          {subject}
        </h2>
      ) : (
        <>
          <div
            className={clsx(
              `anim-show aspect-square h-32 rounded-2xl bg-primary transition-all md:h-60`,
            )}
            style={{
              transform: `rotate(${45 * (time - cooldown)}deg)`,
            }}
          ></div>
          <span className="absolute text-6xl font-bold text-white drop-shadow-md md:text-8xl">
            {cooldown}
          </span>
        </>
      )}
    </section>
  )
}

export default Start
