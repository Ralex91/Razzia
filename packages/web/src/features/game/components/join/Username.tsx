import { STATUS } from "@razzia/common/types/game/status"
import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import Input from "@razzia/web/components/Input"
import { joinGame } from "@razzia/web/features/game/queries"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { ApiError } from "@razzia/web/lib/api"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { StatusCodes } from "http-status-codes"
import { type KeyboardEvent, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const Username = () => {
  const { inviteCode, startJoin, setStatus, setInviteCode } = usePlayerStore()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const { t } = useTranslation()

  const { mutate: join, isPending } = useMutation({
    mutationFn: joinGame,
    onSuccess: ({ gameId, ticket }) => {
      localStorage.setItem("game_id", gameId)

      if (inviteCode) {
        localStorage.setItem("game_pin", inviteCode)
      }

      startJoin({ gameId, ticket, username })
      setStatus(STATUS.WAIT, { text: "game:waitingForPlayers" })
      navigate({ to: "/party/$gameId", params: { gameId } })
    },
    onError: (error) => {
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:route.description"),
      )

      if (error instanceof ApiError && error.status === StatusCodes.NOT_FOUND) {
        setInviteCode(null)
      }
    },
  })

  const handleLogin = () => {
    if (!inviteCode) {
      return
    }

    join({ inviteCode, username })
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <Card>
      <Input
        className="text-center"
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("game:usernamePlaceholder")}
      />
      <Button className="mt-4" onClick={handleLogin} disabled={isPending}>
        {t("common:submit")}
      </Button>
    </Card>
  )
}

export default Username
