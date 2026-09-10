import { useSharedMedia } from "@razzia/web/hooks/useSharedMedia"
import { Music, Pause, Play } from "lucide-react"
import { type MouseEvent, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  src: string
  autoPlay?: boolean
  onEnded?: () => void
}

const formatTime = (seconds: number): string => {
  const whole = Math.floor(Number.isFinite(seconds) ? seconds : 0)
  const min = Math.floor(whole / 60)
  const sec = String(whole % 60).padStart(2, "0")

  return `${min}:${sec}`
}

const AudioPlayer = ({ src, autoPlay = false, onEnded }: Props) => {
  const { t } = useTranslation()
  const hostRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const audioRef = useSharedMedia("audio", hostRef, {
    src,
    autoPlay,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => {
      setPlaying(false)
      onEnded?.()
    },
    onTimeUpdate: setCurrentTime,
    onLoadedMetadata: setDuration,
  })

  const togglePlay = () => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }

  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current

    if (!audio || !duration) {
      return
    }

    const { left, width } = e.currentTarget.getBoundingClientRect()
    audio.currentTime = ((e.clientX - left) / width) * duration
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div
      className="bg-background/90 flex w-full max-w-md flex-col gap-3 rounded-xl p-4 shadow-md ring-1 ring-black/10"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={hostRef} hidden />

      <div className="flex items-center gap-3">
        <span className="bg-accent text-accent-foreground flex size-12 shrink-0 items-center justify-center rounded-full">
          <Music className="size-6" />
        </span>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={t(playing ? "common:pause" : "common:play")}
          className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition hover:brightness-95"
        >
          {playing ? (
            <Pause className="size-5" />
          ) : (
            <Play className="size-5 translate-x-px" />
          )}
        </button>

        <span className="text-muted-foreground ml-auto text-sm tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        onClick={seek}
        className="bg-accent h-2 w-full cursor-pointer overflow-hidden rounded-full"
      >
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default AudioPlayer
