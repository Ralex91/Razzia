import type { Role, User } from "@razzia/common/types/user"
import { quizzValidator } from "@razzia/common/validators/quizz"
import {
  credentialsRepo,
  invitesRepo,
  quizzesRepo,
  sharesRepo,
  usersRepo,
} from "@razzia/socket/db/repositories"
import { assertIsAdmin, assertCanView } from "@razzia/socket/services/authz"
import { bootstrap, completeBootstrap } from "@razzia/socket/services/auth/bootstrap"
import {
  authenticationOptions,
  registrationOptions,
  verifyAuthentication,
  verifyRegistration,
} from "@razzia/socket/services/auth/passkey"
import {
  buildSessionCookie,
  clearSessionCookie,
  issueSession,
  parseCookies,
  resolveSession,
  revokeSession,
  SESSION_COOKIE,
} from "@razzia/socket/services/auth/session"
import crypto from "crypto"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"

const hash = (t: string) => crypto.createHash("sha256").update(t).digest("hex")

// Short-lived store for registrations that are mid-ceremony: the invite has
// been checked (but NOT consumed) and no user row exists yet. Only promoted
// to a real, permanent account once the passkey attestation is verified in
// step 2 — see the rationale on /api/auth/register/options below.
interface PendingRegistration {
  inviteHash: string
  username: string
  displayName: string
  role: Role
  expires: number
}
const pendingRegistrations = new Map<string, PendingRegistration>()
const PENDING_REGISTRATION_TTL = 5 * 60 * 1000

const rememberPendingRegistration = (
  id: string,
  data: Omit<PendingRegistration, "expires">,
): void => {
  pendingRegistrations.set(id, { ...data, expires: Date.now() + PENDING_REGISTRATION_TTL })
}

const recallPendingRegistration = (id: string): PendingRegistration | null => {
  const entry = pendingRegistrations.get(id)
  pendingRegistrations.delete(id)

  if (!entry || entry.expires < Date.now()) {
    return null
  }

  return entry
}

// Tight limits on the auth surface: these are the routes an attacker would
// script against to brute-force logins or spam registrations/invites.
const authRateLimit = { max: 10, timeWindow: "1 minute" }

const currentUser = (req: FastifyRequest): User | null => {
  const cookies = parseCookies(req.headers.cookie)

  return resolveSession(cookies[SESSION_COOKIE])
}

const requireUser = (req: FastifyRequest, reply: FastifyReply): User | null => {
  const user = currentUser(req)

  if (!user) {
    reply.code(401).send({ error: "errors:auth.unauthenticated" })

    return null
  }

  return user
}

export const registerHttpRoutes = (app: FastifyInstance): void => {
  bootstrap()

  /* ------------------------- Registration ------------------------- */

  // Step 1: validate the invite (WITHOUT consuming it) and hand back WebAuthn
  // creation options for a *pending* registration. Neither the invite nor the
  // chosen username is committed yet — that only happens in step 2, once the
  // client actually proves possession of a passkey. This prevents an
  // abandoned/incomplete registration (dropped connection, or someone
  // intentionally starting-but-not-finishing with a colleague's invite link)
  // from permanently burning a one-time invite or squatting a username.
  app.post(
    "/api/auth/register/options",
    { config: { rateLimit: authRateLimit } },
    async (req, reply) => {
      const body = req.body as {
        invite: string
        username: string
        displayName: string
      }

      const inviteHash = hash(body.invite)
      const invite = invitesRepo.peek(inviteHash)

      if (!invite) {
        return reply.code(400).send({ error: "errors:auth.invalidInvite" })
      }

      if (usersRepo.byUsername(body.username)) {
        return reply.code(409).send({ error: "errors:auth.usernameTaken" })
      }

      const pendingId = crypto.randomUUID()

      rememberPendingRegistration(pendingId, {
        inviteHash,
        username: body.username,
        displayName: body.displayName,
        role: invite.role,
      })

      const options = await registrationOptions({
        id: pendingId,
        username: body.username,
        displayName: body.displayName,
      })

      return { userId: pendingId, options }
    },
  )

  // Step 2: verify the attestation, and ONLY on success — consume the invite,
  // create the permanent user row, and persist the credential against it.
  app.post(
    "/api/auth/register/verify",
    { config: { rateLimit: authRateLimit } },
    async (req, reply) => {
      const body = req.body as { userId: string; response: unknown; deviceLabel?: string }
      const pendingReg = recallPendingRegistration(body.userId)

      if (!pendingReg) {
        return reply.code(400).send({ error: "errors:auth.registrationExpired" })
      }

      const registration = await verifyRegistration({ id: body.userId }, body.response)

      if (!registration) {
        return reply.code(400).send({ error: "errors:auth.registrationFailed" })
      }

      // Re-check both invariants now, right before committing — they were
      // only peeked (not locked) in step 1, so a race is still possible.
      const invite = invitesRepo.consume(pendingReg.inviteHash)

      if (!invite) {
        return reply.code(400).send({ error: "errors:auth.invalidInvite" })
      }

      if (usersRepo.byUsername(pendingReg.username)) {
        return reply.code(409).send({ error: "errors:auth.usernameTaken" })
      }

      const isFirstUser = usersRepo.count() === 0
      const user = usersRepo.create({
        username: pendingReg.username,
        displayName: pendingReg.displayName,
        role: invite.role,
      })

      credentialsRepo.create({
        id: registration.credentialId,
        userId: user.id,
        publicKey: registration.publicKey,
        counter: registration.counter,
        transports: registration.transports,
        deviceLabel: body.deviceLabel,
      })

      if (isFirstUser || user.role === "admin") {
        completeBootstrap(user.id)
      }

      const token = issueSession(user.id)
      reply.header("Set-Cookie", buildSessionCookie(token))

      return { user: publicUser(user) }
    },
  )

  /* ------------------------ Authentication ------------------------ */

  app.post(
    "/api/auth/login/options",
    { config: { rateLimit: authRateLimit } },
    async () => authenticationOptions(),
  )

  app.post(
    "/api/auth/login/verify",
    { config: { rateLimit: authRateLimit } },
    async (req, reply) => {
      const body = req.body as { response: never; challenge: string }
      const user = await verifyAuthentication(body.response, body.challenge)

      if (!user) {
        return reply.code(401).send({ error: "errors:auth.loginFailed" })
      }

      const token = issueSession(user.id)
      reply.header("Set-Cookie", buildSessionCookie(token))

      return { user: publicUser(user) }
    },
  )

  app.post("/api/auth/logout", async (req, reply) => {
    const cookies = parseCookies(req.headers.cookie)
    revokeSession(cookies[SESSION_COOKIE])
    reply.header("Set-Cookie", clearSessionCookie())

    return { ok: true }
  })

  app.get("/api/auth/me", async (req, reply) => {
    const user = currentUser(req)

    return user ? { user: publicUser(user) } : reply.code(401).send({ user: null })
  })

  /* --------------------- Admin: user management ------------------- */

  app.get("/api/admin/users", async (req, reply) => {
    const user = requireUser(req, reply)
    if (!user) return
    assertIsAdmin(user)

    return { users: usersRepo.all().map(publicUser) }
  })

  app.post("/api/admin/invites", async (req, reply) => {
    const user = requireUser(req, reply)
    if (!user) return
    assertIsAdmin(user)

    const body = req.body as { role?: "admin" | "manager" }
    const token = crypto.randomBytes(18).toString("base64url")
    invitesRepo.create(hash(token), body.role ?? "manager", 1000 * 60 * 60 * 24 * 7)

    return { invite: token }
  })

  app.patch("/api/admin/users/:id", async (req, reply) => {
    const user = requireUser(req, reply)
    if (!user) return
    assertIsAdmin(user)

    const { id } = req.params as { id: string }
    const body = req.body as { role?: "admin" | "manager"; disabled?: boolean }

    if (body.role) usersRepo.setRole(id, body.role)
    if (typeof body.disabled === "boolean") usersRepo.setDisabled(id, body.disabled)

    return { ok: true }
  })

  app.delete("/api/admin/users/:id", async (req, reply) => {
    const user = requireUser(req, reply)
    if (!user) return
    assertIsAdmin(user)

    const { id } = req.params as { id: string }

    if (id === user.id) {
      return reply.code(400).send({ error: "errors:admin.cannotDeleteSelf" })
    }

    usersRepo.delete(id)

    return { ok: true }
  })

  /* --------------------- JSON import / export --------------------- */

  app.get("/api/quizzes/:id/export", async (req, reply) => {
    const user = requireUser(req, reply)
    if (!user) return

    const { id } = req.params as { id: string }
    assertCanView(user, id)

    const quiz = quizzesRepo.byId(id)

    if (!quiz) {
      return reply.code(404).send({ error: "errors:quizz.notFound" })
    }

    const payload = {
      subject: quiz.subject,
      questions: (quiz.data as { questions: unknown[] }).questions,
    }

    reply
      .header("Content-Type", "application/json")
      .header(
        "Content-Disposition",
        `attachment; filename="${quiz.subject.replace(/[^a-z0-9]/gi, "_")}.json"`,
      )

    return payload
  })

  app.post("/api/quizzes/import", async (req, reply) => {
    const user = requireUser(req, reply)
    if (!user) return

    const parsed = quizzValidator.safeParse(req.body)

    if (!parsed.success) {
      return reply.code(400).send({ error: "errors:quizz.invalid" })
    }

    const { id } = quizzesRepo.create({
      ownerId: user.id,
      subject: parsed.data.subject,
      data: { questions: parsed.data.questions },
    })

    return { id }
  })

  /* --------------------------- Sharing ---------------------------- */

  app.post("/api/quizzes/:id/share", async (req, reply) => {
    const user = requireUser(req, reply)
    if (!user) return

    const { id } = req.params as { id: string }
    const body = req.body as { granteeId: string; permission: "view" | "run" | "edit" }

    const quiz = quizzesRepo.byId(id)

    if (!quiz || (quiz.ownerId !== user.id && user.role !== "admin")) {
      return reply.code(403).send({ error: "errors:authz.forbidden" })
    }

    sharesRepo.grant(id, body.granteeId, body.permission)

    return { ok: true }
  })
}

const publicUser = (user: User) => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  role: user.role,
  disabled: user.disabled,
})
