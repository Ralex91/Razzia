import type { PublicUser, Role } from "@razzia/common/types/user"
import Button from "@razzia/web/components/Button"
import Card from "@razzia/web/components/Card"
import Loader from "@razzia/web/components/Loader"
import {
  createInvite,
  deleteUser,
  listUsers,
  updateUser,
} from "@razzia/web/features/auth/api"
import { useAuthStore } from "@razzia/web/features/auth/store"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Copy, ShieldCheck, Trash2, UserCog } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const AdminConsole = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuthStore()
  const [users, setUsers] = useState<PublicUser[] | null>(null)
  const [inviteRole, setInviteRole] = useState<Role>("manager")
  const [invite, setInvite] = useState("")

  useEffect(() => {
    // Guard: only admins may see this console.
    if (user && !isAdmin()) {
      navigate({ to: "/manager/config" })
    }
    // oxlint-disable-next-line
  }, [user])

  const refresh = () => listUsers().then(setUsers).catch(() => setUsers([]))

  useEffect(() => {
    refresh()
  }, [])

  const guard = async (fn: () => Promise<unknown>) => {
    try {
      await fn()
      await refresh()
    } catch (error) {
      const key = error instanceof Error ? error.message : "errors:unexpected"
      toast.error(key.startsWith("errors:") ? t(key) : t("errors:unexpected"))
    }
  }

  const handleRole = (u: PublicUser) =>
    guard(() => updateUser(u.id, { role: u.role === "admin" ? "manager" : "admin" }))

  const handleDisabled = (u: PublicUser) =>
    guard(() => updateUser(u.id, { disabled: !u.disabled }))

  const handleDelete = (u: PublicUser) => {
    if (!confirm(t("manager:admin.confirmDelete", { name: u.displayName }))) {
      return
    }

    guard(() => deleteUser(u.id))
  }

  const handleInvite = async () => {
    try {
      const code = await createInvite(inviteRole)
      setInvite(code)
    } catch {
      toast.error(t("errors:unexpected"))
    }
  }

  const copyInvite = () => {
    navigator.clipboard.writeText(invite)
    toast.success(t("manager:admin.inviteCopied"))
  }

  if (!users) {
    return <Loader className="h-23" />
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
      <div className="flex items-center gap-2">
        <UserCog className="text-primary size-6" />
        <h1 className="text-foreground text-2xl font-bold">
          {t("manager:admin.title")}
        </h1>
      </div>

      <Card>
        <h2 className="text-foreground mb-3 font-semibold">
          {t("manager:admin.invites")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="border-border bg-background text-foreground rounded-lg border px-3 py-2 text-sm"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
          >
            <option value="manager">{t("auth:roles.manager")}</option>
            <option value="admin">{t("auth:roles.admin")}</option>
          </select>
          <Button onClick={handleInvite}>{t("manager:admin.generate")}</Button>
        </div>
        {invite && (
          <div className="border-border mt-3 flex items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2">
            <code className="text-foreground truncate text-sm">{invite}</code>
            <button onClick={copyInvite} type="button" aria-label={t("manager:admin.copy")}>
              <Copy className="text-muted-foreground size-4" />
            </button>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-foreground mb-3 font-semibold">
          {t("manager:admin.users")}
        </h2>
        <ul className="flex flex-col divide-y divide-border">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-foreground truncate font-medium">
                  {u.displayName}
                  {u.disabled && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({t("manager:admin.disabled")})
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground truncate text-sm">@{u.username}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="hover:bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                  onClick={() => handleRole(u)}
                  disabled={u.id === user?.id}
                  type="button"
                >
                  <ShieldCheck className="size-3.5" />
                  {t(`auth:roles.${u.role}`)}
                </button>
                <button
                  className="hover:bg-muted rounded-md px-2 py-1 text-xs"
                  onClick={() => handleDisabled(u)}
                  disabled={u.id === user?.id}
                  type="button"
                >
                  {u.disabled ? t("manager:admin.enable") : t("manager:admin.disable")}
                </button>
                <button
                  className="hover:bg-destructive/10 text-destructive rounded-md p-1.5"
                  onClick={() => handleDelete(u)}
                  disabled={u.id === user?.id}
                  type="button"
                  aria-label={t("manager:admin.delete")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

export const Route = createFileRoute("/(auth)/manager/admin")({
  component: AdminConsole,
})
