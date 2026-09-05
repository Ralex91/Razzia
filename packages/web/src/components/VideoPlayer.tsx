import { useSharedMedia } from "@razzia/web/hooks/useSharedMedia"
import { useRef } from "react"

interface Props {
  src: string
  autoPlay?: boolean
  onEnded?: () => void
}

const VideoPlayer = ({ src, autoPlay = false, onEnded }: Props) => {
  const hostRef = useRef<HTMLDivElement>(null)

  useSharedMedia("video", hostRef, {
    src,
    autoPlay,
    controls: true,
    className:
      "m-4 mb-2 aspect-video max-h-60 w-auto rounded-md px-4 sm:max-h-100",
    onEnded,
  })

  return <div ref={hostRef} className="contents" />
}

export default VideoPlayer
