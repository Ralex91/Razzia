import { ACCEPTED_MEDIA_TYPES } from "@razzia/common/constants"
import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import QuestionMedia from "@razzia/web/components/QuestionMedia"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"
import {
  MediaRequestError,
  uploadMedia,
} from "@razzia/web/features/quizz/api/media"
import MediaLibrary from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary"
import MediaUrlDialog from "@razzia/web/features/quizz/components/QuestionEditor/MediaUrlDialog"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { useSessionExpiredRedirect } from "@razzia/web/features/quizz/hooks/useSessionExpiredRedirect"
import { isVideoFile } from "@razzia/web/features/quizz/utils/media"
import { ImageOff, Library, Link, Upload } from "lucide-react"
import { type ChangeEvent, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const UPLOAD_ERROR_KEYS: Record<number, string> = {
  413: "errors:media.tooLarge",
  415: "errors:media.invalidType",
}

const uploadErrorKey = (error: unknown): string => {
  if (!(error instanceof MediaRequestError)) {
    return "errors:media.uploadFailed"
  }

  if (error.code === "video-not-hosted") {
    return "errors:media.videoUpload"
  }

  return UPLOAD_ERROR_KEYS[error.status] ?? "errors:media.uploadFailed"
}

const UPLOAD_ACCEPT = Object.keys(ACCEPTED_MEDIA_TYPES).join(",")

const MEDIA_BUTTON_CLASS =
  "bg-accent text-accent-foreground hover:bg-accent transition-colors"

const QuestionEditorMedia = () => {
  const { updateQuestion, currentIndex, currentQuestion } = useQuizzEditor()
  const questionMedia = currentQuestion.media
  const { clientId } = useSocket()
  const redirectIfSessionExpired = useSessionExpiredRedirect()
  const { t } = useTranslation()
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false)

  const handleRemoveMedia = () => {
    if (!questionMedia) {
      return
    }

    updateQuestion(currentIndex, { media: undefined })
  }

  const handleUploadMedia = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""

    if (!file) {
      return
    }

    if (isVideoFile(file)) {
      toast.error(t("errors:media.videoUpload"))

      return
    }

    try {
      const { url, type } = await uploadMedia(file, clientId)
      updateQuestion(currentIndex, { media: { type, url } })
    } catch (error) {
      if (redirectIfSessionExpired(error)) {
        return
      }

      toast.error(t(uploadErrorKey(error)))
    }
  }

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 p-4">
      <QuestionMedia media={currentQuestion.media} alt="Question Media" />

      {!questionMedia?.type && (
        <Card className="my-auto flex max-h-100 w-full max-w-xl flex-1 flex-col items-center justify-center gap-2">
          <ImageOff className="stroke-accent-foreground size-16" />
          <p className="text-accent-foreground text-center text-sm">
            {t("quizz:question.addMediaHint")}
          </p>

          <Button
            onClick={() => setIsUrlDialogOpen(true)}
            className={MEDIA_BUTTON_CLASS}
            classNameContent="gap-1.5"
          >
            <Link className="size-5" />
            <p>{t("quizz:question.addFromUrl")}</p>
          </Button>

          <div className="my-1 flex w-full max-w-md items-center gap-3">
            <span className="bg-accent h-px flex-1" />
            <span className="text-muted-foreground text-xs uppercase">
              {t("common:or")}
            </span>
            <span className="bg-accent h-px flex-1" />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <label
              className={`${MEDIA_BUTTON_CLASS} flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 font-semibold`}
            >
              <Upload className="size-6" />
              <span>{t("quizz:question.uploadMedia")}</span>
              <input
                type="file"
                accept={UPLOAD_ACCEPT}
                className="hidden"
                onChange={handleUploadMedia}
              />
            </label>
            <Button
              onClick={() => setIsLibraryOpen(true)}
              className={MEDIA_BUTTON_CLASS}
            >
              <div className="flex items-center gap-1.5">
                <Library className="size-6" />
                <p>{t("quizz:question.mediaLibrary")}</p>
              </div>
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">
            {t("quizz:question.uploadNote")}
          </p>
        </Card>
      )}

      {questionMedia?.type && (
        <div className="absolute bottom-4">
          <Button
            className="bg-accent text-foreground hover:bg-accent rounded-sm px-4 py-2 font-semibold transition-colors"
            onClick={handleRemoveMedia}
          >
            {t("common:delete")}
          </Button>
        </div>
      )}

      {isLibraryOpen && (
        <MediaLibrary onClose={() => setIsLibraryOpen(false)} />
      )}

      {isUrlDialogOpen && (
        <MediaUrlDialog onClose={() => setIsUrlDialogOpen(false)} />
      )}
    </div>
  )
}

export default QuestionEditorMedia
