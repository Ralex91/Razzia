import { useMutation } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import { type SubmitEvent, useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import PinInput from "@razzia/web/components/PinInput"
import { checkInviteCode } from "@razzia/web/features/game/queries"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { ApiError } from "@razzia/web/lib/api"

const Room = () => {
  const { updatePlayer } = usePlayerStore()
  const [invitation, setInvitation] = useState("")
  const { pin } = useSearch({ from: "/(auth)/" })
  const hasCheckedRef = useRef(false)
  const { t } = useTranslation()

  const { mutate: check, isPending } = useMutation({
    mutationFn: checkInviteCode,
    onSuccess: ({ generatedUsernames }, code) => {
      updatePlayer({ inviteCode: code, generatedUsernames })
    },
    onError: (error) => {
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:route.description"),
      )
    },
  })

  const handleJoin = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    check(invitation.replace(/\s/gu, ""))
  }

  useEffect(() => {
    if (!pin || hasCheckedRef.current) {
      return
    }

    hasCheckedRef.current = true
    check(pin)
  }, [pin, check])

  return (
    <Card>
      <form onSubmit={handleJoin} className="flex flex-col">
        <p className="mb-2 text-lg font-semibold">{t("game:pinLabel")}</p>
        <PinInput value={invitation} onChange={setInvitation} />
        <Button type="submit" className="mt-4" disabled={isPending}>
          {t("common:submit")}
        </Button>
      </form>
    </Card>
  )
}

export default Room
