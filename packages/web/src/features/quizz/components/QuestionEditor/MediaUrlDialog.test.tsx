import type { QuizzWithId } from "@razzia/common/types/game"
import MediaUrlDialog from "@razzia/web/features/quizz/components/QuestionEditor/MediaUrlDialog"
import {
  QuizzEditorProvider,
  useQuizzEditor,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import "@razzia/web/i18n"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import toast from "react-hot-toast"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn() },
}))

const baseQuizz: QuizzWithId = {
  id: "q1",
  subject: "Test",
  questions: [
    {
      type: "single",
      question: "Q?",
      answers: ["a", "b"],
      solutions: [0],
      cooldown: 5,
      time: 20,
    },
  ],
}

// Surfaces the current question's media so assertions can read what attach wrote.
const MediaProbe = () => {
  const { currentQuestion } = useQuizzEditor()

  return (
    <span data-testid="media">{JSON.stringify(currentQuestion.media)}</span>
  )
}

const renderDialog = (onClose = vi.fn()): { onClose: () => void } => {
  const wrapper = (children: ReactNode) => (
    <QuizzEditorProvider initialData={baseQuizz}>
      <MediaProbe />
      {children}
    </QuizzEditorProvider>
  )

  render(wrapper(<MediaUrlDialog onClose={onClose} />))

  return { onClose }
}

describe("MediaUrlDialog", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear()
  })

  it("attaches the URL with the clicked type and closes", async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()

    await user.type(
      screen.getByPlaceholderText("Enter URL..."),
      "https://example.com/clip.mp4",
    )
    await user.click(screen.getByRole("button", { name: /video/i }))

    expect(
      JSON.parse(screen.getByTestId("media").textContent || "null"),
    ).toEqual({
      type: "video",
      url: "https://example.com/clip.mp4",
    })
    expect(onClose).toHaveBeenCalledOnce()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("toasts and does not attach or close on an invalid URL", async () => {
    const user = userEvent.setup()
    const { onClose } = renderDialog()

    await user.type(screen.getByPlaceholderText("Enter URL..."), "not a url")
    await user.click(screen.getByRole("button", { name: /image/i }))

    expect(screen.getByTestId("media").textContent).toBe("")
    expect(onClose).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledOnce()
  })
})
