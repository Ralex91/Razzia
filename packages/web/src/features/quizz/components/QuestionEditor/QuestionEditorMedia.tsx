import type { QuestionMediaType } from "@razzia/common/types/game"
import { questionMediaValidator } from "@razzia/common/validators/quizz"
import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import Input from "@razzia/web/components/Input"
import QuestionMedia from "@razzia/web/components/QuestionMedia"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { Image, ImageOff, Music, Upload, Video } from "lucide-react"
import { type ChangeEvent } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const QuestionEditorMedia = () => {
  const { updateQuestion, currentIndex, currentQuestion } = useQuizzEditor()
  const questionMedia = currentQuestion.media
  const { t } = useTranslation()

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
      <QuestionMedia media={currentQuestion.media} alt="Question Media" />

      {!questionMedia?.type && (
        <Card className="my-auto flex max-h-100 w-full max-w-xl flex-1 flex-col items-center justify-center gap-2">
          <ImageOff className="stroke-accent-foreground size-16" />
          <p className="text-accent-foreground text-center text-sm">
            {t("quizz:question.addMediaHint")}
          </p>
          <div className="flex w-full max-w-md items-center gap-2">
            <Input
              variant="sm"
              className="flex-1"
              placeholder={t("quizz:question.mediaUrlPlaceholder")}
              value={questionMedia?.url ?? ""}
              onChange={handleChangeMedia}
            />
            <label className="bg-accent text-accent-foreground hover:bg-accent flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors">
              <Upload className="size-4" />
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    const url = reader.result as string
                    updateQuestion(currentIndex, {
                      media: { url },
                    })
                  }
                  reader.readAsDataURL(file)
                  e.target.value = ""
                }}
              />
            </label>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={hadnleChangeMediaType("image")}
              className={`bg-accent text-accent-foreground hover:bg-accent transition-colors`}
            >
              <div className="flex items-center gap-1.5">
                <Image className="size-6" />
                <p>{t("quizz:question.media.image")}</p>
              </div>
            </Button>
            <Button
              onClick={hadnleChangeMediaType("video")}
              className={`bg-accent text-accent-foreground hover:bg-accent transition-colors`}
            >
              <div className="flex items-center gap-1.5">
                <Video className="size-6" />
                <p>{t("quizz:question.media.video")}</p>
              </div>
            </Button>
            <Button
              onClick={hadnleChangeMediaType("audio")}
              className={`bg-accent text-accent-foreground hover:bg-accent transition-colors`}
            >
              <div className="flex items-center gap-1.5">
                <Music className="size-6" />
                <p>{t("quizz:question.media.audio")}</p>
              </div>
            </Button>
          </div>
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
    </div>
  )
}

export default QuestionEditorMedia
