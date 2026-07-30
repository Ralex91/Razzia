import type { PublicUser, Role } from "@razzia/common/types/user"
import { startAuthentication, startRegistration } from "@simplewebauthn/browser"

/** Throws an i18n error key when the response is not ok. */
const parse = async (res: Response) => {
  const data: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    const key = (data as { error?: string }).error ?? "errors:unexpected"
    throw new Error(key)
  }

  return data as Record<string, unknown>
}

const post = (url: string, body?: unknown) =>
  fetch(url, {
    method: "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(parse)

const get = (url: string) => fetch(url, { credentials: "include" }).then(parse)

/* ----------------------------- Session ----------------------------- */

export const me = async (): Promise<PublicUser | null> => {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" })

    // A misconfigured proxy returns the SPA's index.html (200 + text/html);
    // never attempt to parse that as JSON.
    const contentType = res.headers.get("content-type") ?? ""

    if (!res.ok || !contentType.includes("application/json")) {
      return null
    }

    const { user } = (await res.json()) as { user: PublicUser | null }

    return user
  } catch {
    return null
  }
}

export const login = async (): Promise<PublicUser> => {
  const options = await post("/api/auth/login/options")
  const response = await startAuthentication({ optionsJSON: options as never })
  const { user } = await post("/api/auth/login/verify", {
    response,
    challenge: (options as { challenge: string }).challenge,
  })

  return user as PublicUser
}

export const register = async (input: {
  invite: string
  username: string
  displayName: string
}): Promise<PublicUser> => {
  const { userId, options } = await post("/api/auth/register/options", input)
  const response = await startRegistration({ optionsJSON: options as never })
  const { user } = await post("/api/auth/register/verify", {
    userId,
    response,
    deviceLabel: navigator.userAgent.slice(0, 120),
  })

  return user as PublicUser
}

export const logout = () => post("/api/auth/logout")

/* ------------------------- Admin: users ---------------------------- */

export const listUsers = async (): Promise<PublicUser[]> => {
  const { users } = await get("/api/admin/users")

  return users as PublicUser[]
}

/**
 * Directory of users a quiz can be shared with. Unlike listUsers (admin-only),
 * this is available to any authenticated owner so managers can share too.
 */
export const listShareCandidates = async (): Promise<PublicUser[]> => {
  const { users } = await get("/api/directory")

  return users as PublicUser[]
}

export const createInvite = async (role: Role): Promise<string> => {
  const { invite } = await post("/api/admin/invites", { role })

  return invite as string
}

export const updateUser = (
  id: string,
  patch: { role?: Role; disabled?: boolean },
) =>
  fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patch),
  }).then(parse)

export const deleteUser = (id: string) =>
  fetch(`/api/admin/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then(parse)

/* --------------------------- Sharing ------------------------------- */

export const shareQuizz = (
  id: string,
  granteeId: string,
  permission: "view" | "run" | "edit",
) => post(`/api/quizzes/${id}/share`, { granteeId, permission })
