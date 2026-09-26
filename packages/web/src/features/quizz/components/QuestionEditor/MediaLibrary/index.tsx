import type { UploadedMedia } from "@razzia/common/types/game"
import Loader from "@razzia/web/components/Loader"
import MediaCard from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaCard"
import MediaDropOverlay from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaDropOverlay"
import MediaRow from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaRow"
import MediaLibraryEmpty from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaLibraryEmpty"
import MediaLibraryToolbar, {
  type MediaFilter,
  type MediaView,
} from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaLibraryToolbar"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { useUploadMedia } from "@razzia/web/features/quizz/hooks/useUploadMedia"
import {
  deleteMedia,
  mediaKeys,
  mediaListQuery,
} from "@razzia/web/features/quizz/queries"
import { ApiError } from "@razzia/web/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import clsx from "clsx"
import { X } from "lucide-react"
import { Dialog } from "radix-ui"
import { type DragEvent, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

interface Props {
  open: boolean
  onOpenChange: (_open: boolean) => void
}

const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes("Files")

const MediaLibrary = ({ open, onOpenChange }: Props) => {
  const { questions, updateQuestion, currentIndex } = useQuizzEditor()
  const { data, isPending } = useQuery({ ...mediaListQuery(), enabled: open })
  const { upload, pendingCount } = useUploadMedia()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<MediaFilter>("all")
  const [view, setView] = useState<MediaView>("grid")
  const [isDragging, setIsDragging] = useState(false)
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const { mutate: remove } = useMutation({
    mutationFn: (item: UploadedMedia) => deleteMedia(item.name),
    onSuccess: (_, item) => {
      questions.forEach((question, index) => {
        if (question.media?.url === item.url) {
          updateQuestion(index, { media: undefined })
        }
      })
      queryClient.invalidateQueries({ queryKey: mediaKeys.all })
    },
    onError: (error) =>
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:media.notFound"),
      ),
  })

  const media = data?.media ?? []
  const query = search.trim().toLowerCase()
  const visibleMedia = media.filter(
    (item) =>
      (filter === "all" || item.type === filter) &&
      item.name.toLowerCase().includes(query),
  )

  const handleSelect = (item: UploadedMedia) => () => {
    updateQuestion(currentIndex, { media: { type: item.type, url: item.url } })
    onOpenChange(false)
  }

  const handleDelete = (item: UploadedMedia) => () => {
    remove(item)
  }

  const handleDragOver = (e: DragEvent) => {
    if (!hasFiles(e)) {
      return
    }

    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    upload(Array.from(e.dataTransfer.files))
  }

  const isEmpty = !isPending && media.length === 0 && pendingCount === 0
  const hasNoResults =
    !isPending && !isEmpty && pendingCount === 0 && visibleMedia.length === 0

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade fixed inset-0 z-50 bg-black/40" />

        <Dialog.Content
          aria-describedby={undefined}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="bg-background data-[state=open]:animate-fade fixed top-1/2 left-1/2 z-50 flex h-[85dvh] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl p-4 shadow-xl sm:p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="text-foreground text-lg font-semibold">
              {t("quizz:media.library")}
            </Dialog.Title>

            <Dialog.Close
              aria-label={t("common:close")}
              className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-md p-1"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <MediaLibraryToolbar
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            view={view}
            onViewChange={setView}
            onUpload={upload}
          />

          <div className="relative min-h-0 flex-1">
            {isPending && (
              <div className="flex h-full items-center justify-center">
                <Loader className="text-primary size-12" />
              </div>
            )}

            {isEmpty && <MediaLibraryEmpty />}

            {hasNoResults && (
              <p className="text-muted-foreground py-12 text-center">
                {t("quizz:media.noResults")}
              </p>
            )}

            {(visibleMedia.length > 0 || pendingCount > 0) && (
              <div
                className={clsx(
                  "h-full overflow-y-auto p-0.5",
                  view === "grid"
                    ? "grid auto-rows-min grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3"
                    : "flex flex-col gap-1",
                )}
              >
                {Array.from({ length: pendingCount }, (_, index) => (
                  <div
                    key={`pending-${index}`}
                    className={clsx(
                      "bg-accent/60 flex animate-pulse items-center justify-center",
                      view === "grid"
                        ? "aspect-square rounded-xl"
                        : "h-15 rounded-lg",
                    )}
                  >
                    <Loader className="text-primary size-8" />
                  </div>
                ))}

                {visibleMedia.map((item) =>
                  view === "grid" ? (
                    <MediaCard
                      key={item.name}
                      media={item}
                      onSelect={handleSelect(item)}
                      onDelete={handleDelete(item)}
                    />
                  ) : (
                    <MediaRow
                      key={item.name}
                      media={item}
                      onSelect={handleSelect(item)}
                      onDelete={handleDelete(item)}
                    />
                  ),
                )}
              </div>
            )}

            {isDragging && <MediaDropOverlay />}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default MediaLibrary
