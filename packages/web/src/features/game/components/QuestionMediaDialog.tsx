import { MEDIA_TYPES } from "@razzia/common/constants"
import type { QuestionMedia as QuestionMediaType } from "@razzia/common/types/game"
import { Image, Video, X } from "lucide-react"
import { Dialog, VisuallyHidden } from "radix-ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  media: QuestionMediaType
  alt?: string
}

const QuestionMediaDialog = ({ media, alt = "" }: Props) => {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const isVideo = media.type === MEDIA_TYPES.VIDEO
  const Icon = isVideo ? Video : Image

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="hover:bg-accent flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-bold text-black drop-shadow-md">
        <Icon className="size-5" />
        {t(isVideo ? "game:media.showVideo" : "game:media.showImage")}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade fixed inset-0 z-50 bg-black/80" />

        <Dialog.Content
          aria-describedby={undefined}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          className="data-[state=open]:animate-fade fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <VisuallyHidden.Root>
            <Dialog.Title>{alt}</Dialog.Title>
          </VisuallyHidden.Root>

          <Dialog.Close className="absolute top-4 right-4 rounded-lg bg-black/40 p-2 text-white hover:bg-black/60">
            <X className="size-6" />
          </Dialog.Close>

          {isVideo ? (
            <video
              className="max-h-[80svh] w-full rounded-md object-contain"
              src={media.url}
              autoPlay
              controls
            />
          ) : (
            <img
              alt={alt}
              src={media.url}
              className="max-h-[80svh] max-w-full rounded-md object-contain"
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default QuestionMediaDialog
