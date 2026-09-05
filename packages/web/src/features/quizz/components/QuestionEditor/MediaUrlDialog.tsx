import type { QuestionMediaType } from "@razzia/common/types/game"
import { questionMediaValidator } from "@razzia/common/validators/quizz"
import Button from "@razzia/web/components/Button"
import Input from "@razzia/web/components/Input"
import Modal from "@razzia/web/components/Modal"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { Image, Link, type LucideIcon, Music, Video } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

interface Props {
  onClose: () => void
}

const MEDIA_TYPE_OPTIONS: Array<{
  type: QuestionMediaType
  icon: LucideIcon
  labelKey: string
}> = [
  { type: "image", icon: Image, labelKey: "quizz:question.media.image" },
  { type: "audio", icon: Music, labelKey: "quizz:question.media.audio" },
  { type: "video", icon: Video, labelKey: "quizz:question.media.video" },
]

const MediaUrlDialog = ({ onClose }: Props) => {
  const { updateQuestion, currentIndex } = useQuizzEditor()
  const { t } = useTranslation()
  const [urlDraft, setUrlDraft] = useState("")

  const attach = (type: QuestionMediaType) => () => {
    const result = questionMediaValidator.safeParse({ type, url: urlDraft })

    if (!result.success) {
      toast.error(t(result.error.issues[0].message))

      return
    }

    updateQuestion(currentIndex, { media: result.data })
    onClose()
  }

  return (
    <Modal
      title={t("quizz:question.addFromUrlTitle")}
      onClose={onClose}
      className="w-full max-w-lg"
    >
      <Input
        variant="sm"
        placeholder={t("quizz:question.mediaUrlPlaceholder")}
        value={urlDraft}
        onChange={(e) => setUrlDraft(e.target.value)}
      />

      <div className="flex flex-wrap justify-center gap-1.5">
        {MEDIA_TYPE_OPTIONS.map(({ type, icon: Icon, labelKey }) => (
          <Button key={type} onClick={attach(type)} classNameContent="gap-1.5">
            <Icon className="size-5" />
            <p>{t(labelKey)}</p>
          </Button>
        ))}
      </div>

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Link className="size-3.5 shrink-0" />
        {t("quizz:question.externalLinkNotice")}
      </p>
    </Modal>
  )
}

export default MediaUrlDialog
