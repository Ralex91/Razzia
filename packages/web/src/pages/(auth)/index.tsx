import Reconnect from "@razzia/web/features/game/components/join/Reconnect"
import Room from "@razzia/web/features/game/components/join/Room"
import Username from "@razzia/web/features/game/components/join/Username"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { createFileRoute } from "@tanstack/react-router"

const PlayerAuthPage = () => {
  const { inviteCode } = usePlayerStore()

  if (inviteCode) {
    return <Username />
  }

  return (
    <>
      <Room />
      <Reconnect />
    </>
  )
}

export const Route = createFileRoute("/(auth)/")({
  component: PlayerAuthPage,
})
