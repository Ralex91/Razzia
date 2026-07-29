import type { User } from "@razzia/common/types/user"
import { quizzValidator } from "@razzia/common/validators/quizz"
import {
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

  // Step 1: redeem invite, create the pending user, return creation options.
  app.post("/api/auth/register/options", async (req, reply) => {
    const body = req.body as {
      invite: string
      username: string
      displayName: string
    }

    const invite = invitesRepo.consume(hash(body.invite))

    if (!invite) {
      return reply.code(400).send({ error: "errors:auth.invalidInvite" })
    }

    if (usersRepo.byUsername(body.username)) {
      return reply.code(409).send({ error: "errors:auth.usernameTaken" })
    }

    const isFirstUser = usersRepo.count() === 0
    const user = usersRepo.create({
      username: body.username,
      displayName: body.displayName,
      role: invite.role,
    })

    if (isFirstUser || user.role === "admin") {
      completeBootstrap(user.id)
    }

    const options = await registrationOptions(user)

    return { userId: user.id, options }
  })

  // Step 2: verify attestation, issue session.
  app.post("/api/auth/register/verify", async (req, reply) => {
    const body = req.body as { userId: string; response: unknown; deviceLabel?: string }
    const user = usersRepo.byId(body.userId)

    if (!user) {
      return reply.code(404).send({ error: "errors:auth.userNotFound" })
    }

    const ok = await verifyRegistration(user, body.response, body.deviceLabel)

    if (!ok) {
      return reply.code(400).send({ error: "errors:auth.registrationFailed" })
    }

    const token = issueSession(user.id)
    reply.header("Set-Cookie", buildSessionCookie(token))

    return { user: publicUser(user) }
  })

  /* ------------------------ Authentication ------------------------ */

  app.post("/api/auth/login/options", async () => authenticationOptions())

  app.post("/api/auth/login/verify", async (req, reply) => {
    const body = req.body as { response: never; challenge: string }
    const user = await verifyAuthentication(body.response, body.challenge)

    if (!user) {
      return reply.code(401).send({ error: "errors:auth.loginFailed" })
    }

    const token = issueSession(user.id)
    reply.header("Set-Cookie", buildSessionCookie(token))

    return { user: publicUser(user) }
  })

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
