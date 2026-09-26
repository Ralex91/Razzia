import { MEDIA_TYPES } from "@razzia/common/constants"
import type { UploadedMedia } from "@razzia/common/types/game"
import AlertDialog from "@razzia/web/components/AlertDialog"
import clsx from "clsx"
import { Music, Trash2, Video } from "lucide-react"
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
          {media.type === MEDIA_TYPES.AUDIO && (
            <div className="bg-accent text-accent-foreground flex size-full items-center justify-center">
              <Music className="size-12" />
            </div>
          )}

          {media.type === MEDIA_TYPES.IMAGE && (
            <img
              src={media.url}
              alt={media.name}
              loading="lazy"
              className="bg-accent size-full object-cover transition duration-300 group-hover:scale-105"
            />
          )}

          {media.type === MEDIA_TYPES.VIDEO && (
            <>
              <video
                src={media.url}
                preload="metadata"
                muted
                className="bg-accent size-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-2 left-2 rounded-md bg-black/60 p-1 text-white">
                <Video className="size-4" />
              </span>
            </>
          )}

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

      <AlertDialog
        trigger={
          <button
            aria-label={t("quizz:media.delete")}
            className={clsx(
              "bg-background absolute top-2 right-2 rounded-lg p-1.5 shadow-md transition hover:bg-red-50",
              "focus-visible:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100",
            )}
          >
            <Trash2 className="size-4 stroke-red-500" />
          </button>
        }
        title={t("quizz:media.delete")}
        description={t("quizz:media.deleteConfirm", { name: media.name })}
        confirmLabel={t("common:delete")}
        onConfirm={onDelete}
      />
    </div>
  )
}

export default MediaCard
