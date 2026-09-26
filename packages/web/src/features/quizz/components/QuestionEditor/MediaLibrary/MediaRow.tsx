import type { UploadedMedia } from "@razzia/common/types/game"
import MediaDeleteButton from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaDeleteButton"
import MediaThumbnail from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaThumbnail"
import { useTranslation } from "react-i18next"

interface Props {
  media: UploadedMedia
  onSelect: () => void
  onDelete: () => void
}

const MediaRow = ({ media, onSelect, onDelete }: Props) => {
  const { t } = useTranslation()

  return (
    <div className="hover:bg-accent/50 flex items-center gap-2 rounded-lg pr-2 transition">
      <button
        onClick={onSelect}
        title={media.name}
        className="focus-visible:ring-primary flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5 text-left ring-2 ring-transparent focus-visible:outline-none"
      >
        <div className="relative size-12 shrink-0 overflow-hidden rounded-md">
          <MediaThumbnail media={media} size="sm" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">
            {media.name}
          </p>
          <p className="text-muted-foreground text-xs">
            {t(`quizz:question.media.${media.type}`)}
          </p>
        </div>
      </button>

      <MediaDeleteButton media={media} onDelete={onDelete} />
    </div>
  )
}

export default MediaRow
