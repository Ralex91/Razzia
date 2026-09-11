import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import { inviteCodeQuery } from "@razzia/web/features/game/queries"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

const clearSavedGame = () => {
  localStorage.removeItem("game_pin")
  localStorage.removeItem("game_id")
}

const Reconnect = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [saved, setSaved] = useState(() => ({
    pin: localStorage.getItem("game_pin"),
    gameId: localStorage.getItem("game_id"),
  }))

  const { data, isPending } = useQuery({
    ...inviteCodeQuery(saved.pin ?? ""),
    enabled: Boolean(saved.pin && saved.gameId),
  })

  useEffect(() => {
    if (data && !data.valid) {
      clearSavedGame()
    }
  }, [data])

  const handleReconnect = () => {
    if (saved.gameId) {
      navigate({ to: "/party/$gameId", params: { gameId: saved.gameId } })
    }
  }

  const handleDismiss = () => {
    clearSavedGame()
    setSaved({ pin: null, gameId: null })
  }

  if (!saved.pin || !saved.gameId || isPending || !data?.valid) {
    return null
  }

  return (
    <Card className="relative mt-4 gap-3">
      <button
        className="absolute top-3 right-3 opacity-40 hover:opacity-100"
        onClick={handleDismiss}
      >
        <X className="size-6" />
      </button>
      <p className="font-semibold">{t("game:reconnectTitle")}</p>
      <Button onClick={handleReconnect}>{t("game:reconnect")}</Button>
    </Card>
  )
}

export default Reconnect
