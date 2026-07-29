import type { PublicUser } from "@razzia/common/types/user"
import Button from "@razzia/web/components/Button"
import { listUsers, shareQuizz } from "@razzia/web/features/auth/api"
import type { Perm } from "@razzia/web/features/auth/permissions"
import { X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

interface Props {
  quizzId: string
  ownerId?: string
  onClose: () => void
}

const PERMISSIONS: Perm[] = ["view", "run", "edit"]

const ShareDialog = ({ quizzId, ownerId, onClose }: Props) => {
  const { t } = useTranslation()
  const [users, setUsers] = useState<PublicUser[]>([])
  const [granteeId, setGranteeId] = useState("")
  const [permission, setPermission] = useState<Perm>("run")
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch(() => setLoadError(true))
  }, [])

  const candidates = useMemo(
    () => users.filter((u) => u.id !== ownerId && !u.disabled),
    [users, ownerId],
  )

  const handleShare = async () => {
    if (!granteeId) {
      toast.error(t("manager:share.pickUser"))

      return
    }

    setBusy(true)

    try {
      await shareQuizz(quizzId, granteeId, permission)
      toast.success(t("manager:share.success"))
      onClose()
    } catch (error) {
      const key = error instanceof Error ? error.message : "errors:unexpected"
      toast.error(key.startsWith("errors:") ? t(key) : t("errors:unexpected"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-md rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-lg font-bold">
            {t("manager:share.title")}
          </h2>
          <button onClick={onClose} type="button" aria-label={t("common:close")}>
            <X className="text-muted-foreground size-5" />
          </button>
        </div>

        {loadError ? (
          <p className="text-muted-foreground text-sm">
            {t("manager:share.noDirectory")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="text-muted-foreground text-sm font-medium">
              {t("manager:share.user")}
            </label>
            <select
              className="border-border bg-background text-foreground rounded-lg border px-3 py-2 text-sm"
              value={granteeId}
              onChange={(e) => setGranteeId(e.target.value)}
            >
              <option value="">{t("manager:share.pickUser")}</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName} (@{u.username})
                </option>
              ))}
            </select>

            <label className="text-muted-foreground text-sm font-medium">
              {t("manager:share.permission")}
            </label>
            <select
              className="border-border bg-background text-foreground rounded-lg border px-3 py-2 text-sm"
              value={permission}
              onChange={(e) => setPermission(e.target.value as Perm)}
            >
              {PERMISSIONS.map((p) => (
                <option key={p} value={p}>
                  {t(`manager:quizz.perm.${p}`)}
                </option>
              ))}
            </select>

            <Button className="mt-2 w-full" onClick={handleShare} disabled={busy}>
              {t("manager:share.confirm")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShareDialog
