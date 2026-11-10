import { useTranslation } from "react-i18next"
import type { UploadedMedia } from "@razzia/common/types/game"
import MediaDeleteButton from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaDeleteButton"
import MediaThumbnail from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaThumbnail"

interface Props {
  media: UploadedMedia
  onSelect: () => void
  onDelete: () => void
}

const MediaRow = ({ media, onSelect, onDelete }: Props) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2 rounded-lg pr-2 transition hover:bg-accent/50">
      <button
        onClick={onSelect}
        title={media.name}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5 text-left ring-2 ring-transparent focus-visible:ring-primary focus-visible:outline-none"
      >
        <div className="relative size-12 shrink-0 overflow-hidden rounded-md">
          <MediaThumbnail media={media} size="sm" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {media.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(`quizz:question.media.${media.type}`)}
          </p>
        </div>
      </button>

      <MediaDeleteButton media={media} onDelete={onDelete} />
    </div>
  )
}

export default MediaRow
