import { MEDIA_TYPES } from "@razzia/common/constants"
import AudioPlayer from "@razzia/web/components/AudioPlayer"
import VideoPlayer from "@razzia/web/components/VideoPlayer"
import type { QuestionMedia as QuestionMediaType } from "@razzia/common/types/game"

interface Props {
  media?: QuestionMediaType
  alt?: string
  autoPlay?: boolean
  onEnded?: () => void
}

const QuestionMedia = ({
  media,
  alt = "",
  autoPlay = false,
  onEnded,
}: Props) => {
  if (media?.type === MEDIA_TYPES.IMAGE) {
    return (
      <img
        alt={alt}
        src={media.url}
        className="max-h-60 w-auto rounded-md sm:max-h-100"
      />
    )
  }

  if (media?.type === MEDIA_TYPES.VIDEO) {
    return <VideoPlayer src={media.url} autoPlay={autoPlay} onEnded={onEnded} />
  }

  if (media?.type === MEDIA_TYPES.AUDIO) {
    return <AudioPlayer src={media.url} autoPlay={autoPlay} onEnded={onEnded} />
  }

  return null
}

export default QuestionMedia
