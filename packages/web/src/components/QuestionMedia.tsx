import { MEDIA_TYPES } from "@razzia/common/constants"
import type { QuestionMedia as QuestionMediaType } from "@razzia/common/types/game"

interface Props {
  media?: QuestionMediaType
  alt?: string
}

const QuestionMedia = ({ media, alt = "" }: Props) => {
  if (media?.type === MEDIA_TYPES.IMAGE) {
    return (
      <img
        alt={alt}
        src={media.url}
        className="max-h-[30svh] w-auto max-w-full rounded-md sm:max-h-100"
      />
    )
  }

  if (media?.type === MEDIA_TYPES.VIDEO) {
    return (
      <video
        className="m-4 mb-2 aspect-video max-h-[30svh] w-auto max-w-full rounded-md px-4 sm:max-h-100"
        src={media.url}
        autoPlay
        controls
      />
    )
  }

  if (media?.type === MEDIA_TYPES.AUDIO) {
    return (
      <audio
        className="m-4 mb-2 w-auto rounded-md"
        src={media.url}
        autoPlay
        controls
      />
    )
  }

  return null
}

export default QuestionMedia
