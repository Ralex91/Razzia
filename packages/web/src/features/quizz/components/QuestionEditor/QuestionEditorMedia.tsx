import { MAX_MEDIA_SIZE, MEDIA_TYPES } from "@razzia/common/constants"
import type { QuestionMediaType } from "@razzia/common/types/game"
import { questionMediaValidator } from "@razzia/common/validators/quizz"
import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import Input from "@razzia/web/components/Input"
import Loader from "@razzia/web/components/Loader"
import QuestionMedia from "@razzia/web/components/QuestionMedia"
import MediaLibrary from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import {
  UPLOAD_ACCEPT,
  useUploadMedia,
} from "@razzia/web/features/quizz/hooks/useUploadMedia"
import clsx from "clsx"
import {
  ChevronDown,
  Image,
  ImageOff,
  Library,
  Link,
  Music,
  Upload,
  Video,
} from "lucide-react"
import { type ChangeEvent, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const MEDIA_TYPE_BUTTONS = [
  { type: MEDIA_TYPES.IMAGE, icon: Image },
  { type: MEDIA_TYPES.VIDEO, icon: Video },
  { type: MEDIA_TYPES.AUDIO, icon: Music },
] as const

const QuestionEditorMedia = () => {
  const { updateQuestion, currentIndex, currentQuestion } = useQuizzEditor()
  const questionMedia = currentQuestion.media
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isUrlOpen, setIsUrlOpen] = useState(Boolean(questionMedia?.url))
  const { t } = useTranslation()

  const { upload, pendingCount } = useUploadMedia(({ type, url }) =>
    updateQuestion(currentIndex, { media: { type, url } }),
  )
  const isUploading = pendingCount > 0

  const handleUploadMedia = (e: ChangeEvent<HTMLInputElement>) => {
    upload(Array.from(e.target.files ?? []))
    e.target.value = ""
  }

  const handleOpenLibrary = () => {
    setIsLibraryOpen(true)
  }

  const handleToggleUrl = () => {
    setIsUrlOpen((current) => !current)
  }

  const hadnleChangeMediaType = (type: QuestionMediaType) => () => {
    const result = questionMediaValidator.safeParse({
      type,
      url: questionMedia?.url,
    })

    if (!result.success) {
      toast.error(t(result.error.issues[0].message))

      return
    }

    updateQuestion(currentIndex, { media: result.data })
  }

  const handleRemoveMedia = () => {
    if (!questionMedia) {
      return
    }

    updateQuestion(currentIndex, { media: undefined })
  }

  const handleChangeMedia = (e: ChangeEvent<HTMLInputElement>) => {
    updateQuestion(currentIndex, {
      media: { url: e.target.value },
    })
  }

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 p-4">
      <QuestionMedia
        media={currentQuestion.media}
        alt="Question Media"
        autoPlay={false}
      />

      {!questionMedia?.type && (
        <Card className="my-auto flex max-h-100 w-full max-w-xl flex-1 flex-col items-center justify-center gap-2">
          <ImageOff className="stroke-accent-foreground size-16" />
          <p className="text-accent-foreground text-center text-sm">
            {t("quizz:question.addMediaHint")}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <label
              aria-disabled={isUploading}
              className="bg-primary flex cursor-pointer items-center gap-1.5 rounded-lg p-2 text-lg font-semibold text-white hover:brightness-[1.05] active:brightness-[0.95] aria-disabled:cursor-wait aria-disabled:opacity-50"
            >
              {isUploading ? (
                <Loader className="size-6 text-white" />
              ) : (
                <Upload className="size-6" />
              )}
              <p>{t("quizz:media.upload")}</p>
              <input
                type="file"
                accept={UPLOAD_ACCEPT}
                className="hidden"
                disabled={isUploading}
                onChange={handleUploadMedia}
              />
            </label>
            <Button
              onClick={handleOpenLibrary}
              className="bg-accent text-accent-foreground"
            >
              <div className="flex items-center gap-1.5">
                <Library className="size-6" />
                <p>{t("quizz:media.library")}</p>
              </div>
            </Button>
          </div>

          <p className="text-accent-foreground text-center text-xs">
            {t("quizz:media.uploadHint", {
              size: MAX_MEDIA_SIZE / 1024 / 1024,
            })}
          </p>

          <button
            onClick={handleToggleUrl}
            aria-expanded={isUrlOpen}
            className="text-accent-foreground hover:text-foreground mt-2 flex items-center gap-1 text-sm font-semibold"
          >
            <Link className="size-4" />
            {t("quizz:media.fromUrl")}
            <ChevronDown
              className={clsx("size-4 transition", isUrlOpen && "rotate-180")}
            />
          </button>

          {isUrlOpen && (
            <div className="flex w-full max-w-md flex-col items-center gap-2">
              <Input
                variant="sm"
                className="w-full"
                placeholder={t("quizz:question.mediaUrlPlaceholder")}
                value={questionMedia?.url ?? ""}
                onChange={handleChangeMedia}
              />
              <div className="flex flex-wrap justify-center gap-2">
                {MEDIA_TYPE_BUTTONS.map(({ type, icon: Icon }) => (
                  <Button
                    key={type}
                    size="sm"
                    onClick={hadnleChangeMediaType(type)}
                    className="bg-accent text-accent-foreground"
                    classNameContent="gap-1.5"
                  >
                    <Icon className="size-4" />
                    {t(`quizz:question.media.${type}`)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <MediaLibrary open={isLibraryOpen} onOpenChange={setIsLibraryOpen} />

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
    </div>
  )
}

export default QuestionEditorMedia
