import { MEDIA_TYPES } from "@razzia/common/constants"
import type { UploadedMedia } from "@razzia/common/types/game"
import clsx from "clsx"
import { Music, Video } from "lucide-react"

interface Props {
  media: UploadedMedia
  size?: "sm" | "lg"
}

const MediaThumbnail = ({ media, size = "lg" }: Props) => {
  const isLarge = size === "lg"
  const previewClassName = clsx(
    "bg-accent size-full object-cover",
    isLarge && "transition duration-300 group-hover:scale-105",
  )

  if (media.type === MEDIA_TYPES.AUDIO) {
    return (
      <div className="bg-accent text-accent-foreground flex size-full items-center justify-center">
        <Music className={isLarge ? "size-12" : "size-5"} />
      </div>
    )
  }

  if (media.type === MEDIA_TYPES.IMAGE) {
    return (
      <img
        src={media.url}
        alt={media.name}
        loading="lazy"
        className={previewClassName}
      />
    )
  }

  return (
    <>
      <video
        src={media.url}
        preload="metadata"
        muted
        className={previewClassName}
      />
      <span
        className={clsx(
          "absolute rounded-md bg-black/60 text-white",
          isLarge ? "bottom-2 left-2 p-1" : "bottom-0.5 left-0.5 p-0.5",
        )}
      >
        <Video className={isLarge ? "size-4" : "size-3"} />
      </span>
    </>
  )
}

export default MediaThumbnail
