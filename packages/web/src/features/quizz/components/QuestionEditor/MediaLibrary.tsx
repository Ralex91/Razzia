import type { StoredMedia } from "@razzia/common/types/game"
import { questionMediaValidator } from "@razzia/common/validators/quizz"
import AlertDialog from "@razzia/web/components/AlertDialog"
import Loader from "@razzia/web/components/Loader"
import Modal from "@razzia/web/components/Modal"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"
import { deleteMedia, listMedia } from "@razzia/web/features/quizz/api/media"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { useSessionExpiredRedirect } from "@razzia/web/features/quizz/hooks/useSessionExpiredRedirect"
import { LayoutGrid, List, Music, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

interface Props {
  onClose: () => void
}

const fileNameFromUrl = (url: string): string => url.replace(/^\/media\//u, "")

type View = "grid" | "list"

// The grid is best for images, the list for audio — where the file name is the
// only thing to go by. The choice is remembered so it does not have to be made
// again on every visit.
const VIEW_STORAGE_KEY = "media-library-view"

const readStoredView = (): View =>
  localStorage.getItem(VIEW_STORAGE_KEY) === "list" ? "list" : "grid"

interface ThumbnailProps {
  item: StoredMedia
  className: string
  iconClassName: string
}

const Thumbnail = ({ item, className, iconClassName }: ThumbnailProps) =>
  item.type === "audio" ? (
    <span
      className={`bg-accent text-accent-foreground flex items-center justify-center ${className}`}
    >
      <Music className={iconClassName} />
    </span>
  ) : (
    <img
      src={item.url}
      alt=""
      className={`object-cover ${className}`}
      loading="lazy"
    />
  )

const MediaLibrary = ({ onClose }: Props) => {
  const { updateQuestion, currentIndex } = useQuizzEditor()
  const { clientId } = useSocket()
  const redirectIfSessionExpired = useSessionExpiredRedirect()
  const { t } = useTranslation()
  const [items, setItems] = useState<StoredMedia[] | null>(null)
  const [view, setView] = useState<View>(readStoredView)

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

  const handleView = (next: View) => () => {
    setView(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  const renderDelete = (url: string, className: string) => (
    <AlertDialog
      trigger={
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label={t("quizz:question.deleteMedia")}
          className={`text-muted-foreground rounded-sm p-1 hover:bg-red-50 hover:text-red-500 ${className}`}
        >
          <Trash2 className="size-4" />
        </button>
      }
      title={t("quizz:question.deleteMedia")}
      description={t("quizz:question.deleteMediaWarning")}
      confirmLabel={t("common:delete")}
      onConfirm={handleDelete(url)}
    />
  )

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
        <>
          <div className="flex justify-end gap-1">
            <button
              onClick={handleView("grid")}
              aria-label={t("quizz:question.gridView")}
              aria-pressed={view === "grid"}
              className="text-muted-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground rounded-md p-1.5"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={handleView("list")}
              aria-label={t("quizz:question.listView")}
              aria-pressed={view === "list"}
              className="text-muted-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground rounded-md p-1.5"
            >
              <List className="size-4" />
            </button>
          </div>

          {view === "grid" ? (
            <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.url}
                  className="hover:ring-primary group bg-accent/40 relative flex flex-col overflow-hidden rounded-lg ring-2 ring-transparent transition"
                >
                  <button
                    onClick={handleSelect(item)}
                    aria-label={t("quizz:question.selectMedia")}
                    className="aspect-square w-full"
                  >
                    <Thumbnail
                      item={item}
                      className="h-full w-full"
                      iconClassName="size-8"
                    />
                  </button>
                  <span
                    className="text-muted-foreground truncate px-2 py-1.5 text-xs"
                    title={fileNameFromUrl(item.url)}
                  >
                    {fileNameFromUrl(item.url)}
                  </span>
                  {renderDelete(
                    item.url,
                    "bg-background absolute top-1.5 right-1.5 hidden group-hover:block",
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.url}
                  className="hover:bg-accent/40 flex items-center gap-3 rounded-lg pr-2 transition"
                >
                  <button
                    onClick={handleSelect(item)}
                    aria-label={t("quizz:question.selectMedia")}
                    className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
                  >
                    <Thumbnail
                      item={item}
                      className="size-12 shrink-0 rounded-md"
                      iconClassName="size-5"
                    />
                    <span className="text-foreground min-w-0 flex-1 truncate text-sm">
                      {fileNameFromUrl(item.url)}
                    </span>
                  </button>
                  {renderDelete(item.url, "shrink-0")}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

export default MediaLibrary
