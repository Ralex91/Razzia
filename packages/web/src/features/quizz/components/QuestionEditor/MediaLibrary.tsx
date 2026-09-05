import type { StoredMedia } from "@razzia/common/types/game"
import { questionMediaValidator } from "@razzia/common/validators/quizz"
import AlertDialog from "@razzia/web/components/AlertDialog"
import Loader from "@razzia/web/components/Loader"
import Modal from "@razzia/web/components/Modal"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"
import { deleteMedia, listMedia } from "@razzia/web/features/quizz/api/media"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { useSessionExpiredRedirect } from "@razzia/web/features/quizz/hooks/useSessionExpiredRedirect"
import { Music, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

interface Props {
  onClose: () => void
}

const fileNameFromUrl = (url: string): string => url.replace(/^\/media\//u, "")

const MediaLibrary = ({ onClose }: Props) => {
  const { updateQuestion, currentIndex } = useQuizzEditor()
  const { clientId } = useSocket()
  const redirectIfSessionExpired = useSessionExpiredRedirect()
  const { t } = useTranslation()
  const [items, setItems] = useState<StoredMedia[] | null>(null)

  useEffect(() => {
    listMedia(clientId)
      .then(setItems)
      .catch((error: unknown) => {
        if (!redirectIfSessionExpired(error)) {
          toast.error(t("errors:media.listFailed"))
        }

        onClose()
      })
    // oxlint-disable-next-line
  }, [])

  const handleSelect = (item: StoredMedia) => () => {
    const result = questionMediaValidator.safeParse(item)

    if (!result.success) {
      toast.error(t(result.error.issues[0].message))

      return
    }

    updateQuestion(currentIndex, { media: result.data })
    onClose()
  }

  const handleDelete = (url: string) => async () => {
    try {
      await deleteMedia(fileNameFromUrl(url), clientId)
      setItems((current) => (current ?? []).filter((item) => item.url !== url))
    } catch (error) {
      if (redirectIfSessionExpired(error)) {
        onClose()

        return
      }

      toast.error(t("errors:media.deleteFailed"))
    }
  }

  return (
    <Modal
      title={t("quizz:question.mediaLibrary")}
      onClose={onClose}
      className="h-[90vh] w-[90vw] overflow-hidden"
    >
      {items === null && (
        <div className="flex flex-1 items-center justify-center py-12">
          <Loader className="text-foreground size-12" />
        </div>
      )}

      {items?.length === 0 && (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {t("quizz:question.mediaLibraryEmpty")}
        </p>
      )}

      {items && items.length > 0 && (
        <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.url}
              className="hover:ring-primary group relative aspect-square overflow-hidden rounded-md ring-2 ring-transparent transition"
            >
              <button
                onClick={handleSelect(item)}
                aria-label={t("quizz:question.selectMedia")}
                className="h-full w-full"
              >
                {item.type === "audio" ? (
                  <span className="bg-accent text-accent-foreground flex h-full w-full flex-col items-center justify-center gap-1 p-2">
                    <Music className="size-8" />
                    <span className="w-full truncate text-center text-xs">
                      {fileNameFromUrl(item.url)}
                    </span>
                  </span>
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
              <AlertDialog
                trigger={
                  <button
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t("quizz:question.deleteMedia")}
                    className="text-muted-foreground bg-background absolute top-1.5 right-1.5 hidden rounded-sm p-1 group-hover:block hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                }
                title={t("quizz:question.deleteMedia")}
                description={t("quizz:question.deleteMediaWarning")}
                confirmLabel={t("common:delete")}
                onConfirm={handleDelete(item.url)}
              />
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

export default MediaLibrary
