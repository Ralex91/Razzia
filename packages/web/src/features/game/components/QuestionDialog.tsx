import { MEDIA_TYPES } from "@razzia/common/constants"
import type { QuestionMedia as QuestionMediaType } from "@razzia/common/types/game"
import clsx from "clsx"
import { X } from "lucide-react"
import { Dialog, VisuallyHidden } from "radix-ui"
import { type PropsWithChildren, useState } from "react"

type Props = PropsWithChildren & {
  question: string
  media?: QuestionMediaType
  showQuestion?: boolean
  className?: string
  label?: string
}

const QuestionDialog = ({
  question,
  media,
  showQuestion,
  className,
  label,
  children,
}: Props) => {
  const [open, setOpen] = useState(false)
  const mediaHeight = showQuestion ? "max-h-[60svh]" : "max-h-[80svh]"

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger aria-label={label} className={className}>
        {children}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade fixed inset-0 z-50 bg-black/60" />

        <Dialog.Content
          aria-describedby={undefined}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          className="data-[state=open]:animate-fade fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 p-4"
        >
          {showQuestion ? (
            <Dialog.Title className="text-center text-2xl font-bold text-white drop-shadow-lg md:text-4xl">
              {question}
            </Dialog.Title>
          ) : (
            <VisuallyHidden.Root>
              <Dialog.Title>{question}</Dialog.Title>
            </VisuallyHidden.Root>
          )}

          <Dialog.Close className="absolute top-4 right-4 rounded-lg bg-black/40 p-2 text-white hover:bg-black/60">
            <X className="size-6" />
          </Dialog.Close>

          {media?.type === MEDIA_TYPES.VIDEO && (
            <video
              className={clsx(mediaHeight, "w-full rounded-md object-contain")}
              src={media.url}
              autoPlay
              controls
            />
          )}

          {media?.type === MEDIA_TYPES.IMAGE && (
            <img
              alt={question}
              src={media.url}
              className={clsx(
                mediaHeight,
                "max-w-full rounded-md object-contain",
              )}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default QuestionDialog
