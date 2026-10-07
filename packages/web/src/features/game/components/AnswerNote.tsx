import { Lightbulb } from "lucide-react"

interface Props {
  note?: string
}

const AnswerNote = ({ note }: Props) => {
  const text = note?.trim()

  if (!text) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-2">
      <div className="anim-show text-foreground flex items-start gap-3 rounded-xl bg-white px-4 py-3 text-base font-semibold shadow-lg md:text-xl">
        <Lightbulb className="text-primary mt-0.5 size-6 shrink-0" />
        <p className="min-w-0 wrap-anywhere whitespace-pre-line">{text}</p>
      </div>
    </div>
  )
}

export default AnswerNote
