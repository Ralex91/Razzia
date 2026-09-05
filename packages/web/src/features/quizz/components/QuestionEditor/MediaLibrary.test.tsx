import type { QuizzWithId } from "@razzia/common/types/game"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"
import {
  deleteMedia,
  listMedia,
  MediaRequestError,
} from "@razzia/web/features/quizz/api/media"
import MediaLibrary from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary"
import { QuizzEditorProvider } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
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
  listMedia: vi.fn(),
  deleteMedia: vi.fn(),
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

// Exposes the id the socket handshake carries, so assertions compare against it.
const ClientIdProbe = () => (
  <span data-testid="client-id">{useSocket().clientId}</span>
)

const renderLibrary = (onClose = vi.fn()): { onClose: () => void } => {
  render(
    <QuizzEditorProvider initialData={baseQuizz}>
      <ClientIdProbe />
      <MediaLibrary onClose={onClose} />
    </QuizzEditorProvider>,
  )

  return { onClose }
}

const socketClientId = (): string => screen.getByTestId("client-id").textContent

describe("MediaLibrary", () => {
  beforeEach(() => {
    navigate.mockClear()
    vi.mocked(toast.error).mockClear()
    vi.mocked(listMedia).mockReset()
    vi.mocked(deleteMedia).mockReset()
  })

  it("lists media using the socket client id, never a password", async () => {
    vi.mocked(listMedia).mockResolvedValue([
      { url: "/media/a.png", type: "image" },
    ])

    renderLibrary()

    await screen.findByRole("button", { name: /delete media/i })

    expect(listMedia).toHaveBeenCalledTimes(1)
    const [[clientId]] = vi.mocked(listMedia).mock.calls
    expect(clientId).toBe(socketClientId())
    expect(clientId).not.toBe("")
    expect(navigate).not.toHaveBeenCalled()
  })

  it("on 401 while deleting shows the session-expired toast, closes and redirects", async () => {
    vi.mocked(listMedia).mockResolvedValue([
      { url: "/media/a.png", type: "image" },
    ])
    vi.mocked(deleteMedia).mockRejectedValue(new MediaRequestError(401))

    const { onClose } = renderLibrary()
    const user = userEvent.setup()

    await user.click(
      await screen.findByRole("button", { name: /delete media/i }),
    )
    await user.click(screen.getByRole("button", { name: /^delete$/i }))

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/manager" }),
    )

    expect(deleteMedia).toHaveBeenCalledWith("a.png", socketClientId())
    expect(toast.error).toHaveBeenCalledWith(
      "Your session has expired. Please sign in again.",
    )
    expect(onClose).toHaveBeenCalled()
  })

  it("on 401 shows the session-expired toast, closes and redirects to /manager", async () => {
    vi.mocked(listMedia).mockRejectedValue(new MediaRequestError(401))

    const { onClose } = renderLibrary()

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/manager" }),
    )

    expect(toast.error).toHaveBeenCalledWith(
      "Your session has expired. Please sign in again.",
    )
    expect(onClose).toHaveBeenCalled()
  })

  it("on another failure shows the list-failed toast without redirecting", async () => {
    vi.mocked(listMedia).mockRejectedValue(new MediaRequestError(500))

    const { onClose } = renderLibrary()

    await waitFor(() => expect(onClose).toHaveBeenCalled())

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).not.toHaveBeenCalledWith(
      "Your session has expired. Please sign in again.",
    )
    expect(navigate).not.toHaveBeenCalled()
  })
})
