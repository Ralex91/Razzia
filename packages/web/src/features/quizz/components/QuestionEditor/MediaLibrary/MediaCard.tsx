import type { UploadedMedia } from "@razzia/common/types/game"
import MediaDeleteButton from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaDeleteButton"
import MediaThumbnail from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaThumbnail"
import { useTranslation } from "react-i18next"

interface Props {
  media: UploadedMedia
  onSelect: () => void
  onDelete: () => void
}

const MediaCard = ({ media, onSelect, onDelete }: Props) => {
  const { t } = useTranslation()

  return (
    <div className="group relative">
      <button
        onClick={onSelect}
        title={media.name}
        className="focus-visible:ring-primary w-full overflow-hidden rounded-xl text-left ring-2 ring-transparent transition focus-visible:outline-none"
      >
        <div className="relative aspect-square overflow-hidden rounded-xl">
          <MediaThumbnail media={media} />

          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-black shadow">
              {t("quizz:media.use")}
            </span>
          </div>
        </div>

        <p className="text-foreground mt-1.5 truncate px-0.5 text-sm font-semibold">
          {media.name}
        </p>
      </button>

      <MediaDeleteButton
        media={media}
        onDelete={onDelete}
        className="bg-background absolute top-2 right-2 shadow-md focus-visible:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100"
      />
    </div>
  )
}

export default MediaCard
