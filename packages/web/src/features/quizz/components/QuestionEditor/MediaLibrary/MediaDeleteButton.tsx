import type { UploadedMedia } from "@razzia/common/types/game"
import AlertDialog from "@razzia/web/components/AlertDialog"
import clsx from "clsx"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

interface Props {
  media: UploadedMedia
  onDelete: () => void
  className?: string
}

const MediaDeleteButton = ({ media, onDelete, className }: Props) => {
  const { t } = useTranslation()

  return (
    <AlertDialog
      trigger={
        <button
          aria-label={t("quizz:media.delete")}
          className={clsx(
            "rounded-lg p-1.5 transition hover:bg-red-50",
            className,
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
  )
}

export default MediaDeleteButton
