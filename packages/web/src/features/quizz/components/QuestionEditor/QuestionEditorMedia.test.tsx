import type { QuizzWithId } from "@razzia/common/types/game"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"
import {
  MediaRequestError,
  uploadMedia,
} from "@razzia/web/features/quizz/api/media"
import QuestionEditorMedia from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorMedia"
import {
  QuizzEditorProvider,
  useQuizzEditor,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import "@razzia/web/i18n"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import toast from "react-hot-toast"
import { beforeEach, describe, expect, it, vi } from "vitest"

const navigate = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn() },
}))

vi.mock("@razzia/web/features/quizz/api/media", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@razzia/web/features/quizz/api/media")
  >()),
  uploadMedia: vi.fn(),
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

const MediaProbe = () => {
  const { currentQuestion } = useQuizzEditor()

  return (
    <span data-testid="media">{JSON.stringify(currentQuestion.media)}</span>
  )
}

// Exposes the id the socket handshake carries, so assertions compare against it.
const ClientIdProbe = () => (
  <span data-testid="client-id">{useSocket().clientId}</span>
)

const uploadPng = async (): Promise<void> => {
  render(
    <QuizzEditorProvider initialData={baseQuizz}>
      <MediaProbe />
      <ClientIdProbe />
      <QuestionEditorMedia />
    </QuizzEditorProvider>,
  )

  const input = screen.getByLabelText(/upload media/i)
  const file = new File(["png"], "a.png", { type: "image/png" })

  await userEvent.setup().upload(input, file)
}

describe("QuestionEditorMedia", () => {
  beforeEach(() => {
    navigate.mockClear()
    vi.mocked(toast.error).mockClear()
    vi.mocked(uploadMedia).mockReset()
  })

  it("uploads with the socket client id and attaches the stored media", async () => {
    vi.mocked(uploadMedia).mockResolvedValue({
      url: "/media/a.png",
      type: "image",
    })

    await uploadPng()

    await waitFor(() =>
      expect(screen.getByTestId("media")).toHaveTextContent("/media/a.png"),
    )

    const [[, clientId]] = vi.mocked(uploadMedia).mock.calls
    expect(clientId).toBe(screen.getByTestId("client-id").textContent)
    expect(navigate).not.toHaveBeenCalled()
  })

  it("on 401 shows the session-expired toast and redirects to /manager", async () => {
    vi.mocked(uploadMedia).mockRejectedValue(new MediaRequestError(401))

    await uploadPng()

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/manager" }),
    )

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith(
      "Your session has expired. Please sign in again.",
    )
  })

  it("on another failure shows the upload error without redirecting", async () => {
    vi.mocked(uploadMedia).mockRejectedValue(new MediaRequestError(413))

    await uploadPng()

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))

    expect(toast.error).not.toHaveBeenCalledWith(
      "Your session has expired. Please sign in again.",
    )
    expect(navigate).not.toHaveBeenCalled()
  })
})
