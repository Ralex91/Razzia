import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import Input from "@razzia/web/components/Input"
import { login, register } from "@razzia/web/features/auth/api"
import type { PublicUser } from "@razzia/common/types/user"
import { Fingerprint, KeyRound, UserPlus } from "lucide-react"
import { type FormEvent, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

type Mode = "login" | "register"

interface Props {
  onAuthed: (_user: PublicUser) => void
}

const ManagerAuth = ({ onAuthed }: Props) => {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>("login")
  const [busy, setBusy] = useState(false)
  const [invite, setInvite] = useState("")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")

  const run = async (action: () => Promise<PublicUser>) => {
    if (busy) {
      return
    }

    setBusy(true)

    try {
      const user = await action()
      toast.success(t("auth:welcome", { name: user.displayName }))
      onAuthed(user)
    } catch (error) {
      // A genuine browser cancel/abort throws a DOMException (NotAllowedError /
      // AbortError). Anything else is a real server or WebAuthn error whose
      // message we surface verbatim so the actual cause is never hidden.
      const name = error instanceof Error ? error.name : ""
      const raw = error instanceof Error ? error.message : String(error)
      const isBrowserAbort =
        error instanceof DOMException ||
        name === "NotAllowedError" ||
        name === "AbortError"

      if (isBrowserAbort) {
        toast.error(t("auth:passkeyFailed"))
      } else if (raw.startsWith("errors:")) {
        toast.error(t(raw))
      } else {
        toast.error(raw)
      }
    } finally {
      setBusy(false)
    }
  }

  const handleLogin = () => run(login)

  const handleRegister = (event: FormEvent) => {
    event.preventDefault()

    if (!invite.trim() || !username.trim()) {
      toast.error(t("auth:missingFields"))

      return
    }

    run(() =>
      register({
        invite: invite.trim(),
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
      }),
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="bg-primary/10 text-primary mb-1 rounded-full p-3">
          <Fingerprint className="size-7" />
        </div>
        <h1 className="text-foreground text-2xl font-bold">
          {t("auth:title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {mode === "login" ? t("auth:loginSubtitle") : t("auth:registerSubtitle")}
        </p>
      </div>

      {mode === "login" ? (
        <div className="mt-6 flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={busy}
          >
            <KeyRound className="size-5" />
            {t("auth:signIn")}
          </Button>
          <button
            className="text-muted-foreground hover:text-foreground text-sm"
            onClick={() => setMode("register")}
            type="button"
          >
            {t("auth:toRegister")}
          </button>
        </div>
      ) : (
        <form className="mt-6 flex flex-col gap-3" onSubmit={handleRegister}>
          <Input
            variant="sm"
            placeholder={t("auth:invitePlaceholder")}
            value={invite}
            onChange={(e) => setInvite(e.target.value)}
            autoComplete="off"
          />
          <Input
            variant="sm"
            placeholder={t("auth:usernamePlaceholder")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <Input
            variant="sm"
            placeholder={t("auth:displayNamePlaceholder")}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
          />
          <Button className="w-full" type="submit" disabled={busy}>
            <UserPlus className="size-5" />
            {t("auth:createAccount")}
          </Button>
          <button
            className="text-muted-foreground hover:text-foreground text-sm"
            onClick={() => setMode("login")}
            type="button"
          >
            {t("auth:toLogin")}
          </button>
        </form>
      )}
    </Card>
  )
}

export default ManagerAuth
