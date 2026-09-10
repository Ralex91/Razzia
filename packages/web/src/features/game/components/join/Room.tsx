import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import PinInput from "@razzia/web/components/PinInput"
import { checkInviteCode } from "@razzia/web/features/game/queries"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import { ApiError } from "@razzia/web/lib/api"
import { useMutation } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const Room = () => {
  const { setInviteCode } = usePlayerStore()
  const [invitation, setInvitation] = useState("")
  const { pin } = useSearch({ from: "/(auth)/" })
  const hasCheckedRef = useRef(false)
  const { t } = useTranslation()

  const { mutate: check, isPending } = useMutation({
    mutationFn: checkInviteCode,
    onSuccess: ({ valid }, code) => {
      if (!valid) {
        toast.error(t("errors:game.notFound"))

        return
      }

      setInviteCode(code)
    },
    onError: (error) => {
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:route.description"),
      )
    },
  })

  const handleJoin = () => {
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
      <p className="mb-2 text-lg font-semibold">{t("game:pinLabel")}</p>
      <PinInput value={invitation} onChange={setInvitation} />
      <Button className="mt-4" onClick={handleJoin} disabled={isPending}>
        {t("common:submit")}
      </Button>
    </Card>
  )
}

export default Room
