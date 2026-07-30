import type { Permission, Role, User } from "@razzia/common/types/user"
import { getDb } from "@razzia/socket/db"
import { nanoid } from "nanoid"

const now = () => new Date().toISOString()

interface UserRow {
  id: string
  username: string
  display_name: string
  role: Role
  disabled: number
  created_at: string
}

const toUser = (row: UserRow): User => ({
  id: row.id,
  username: row.username,
  displayName: row.display_name,
  role: row.role,
  disabled: row.disabled === 1,
  createdAt: row.created_at,
})

/* ----------------------------- Users ----------------------------- */

export const usersRepo = {
  count(): number {
    return (
      getDb().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }
    ).n
  },

  create(input: { username: string; displayName: string; role: Role }): User {
    const user: UserRow = {
      id: nanoid(),
      username: input.username,
      display_name: input.displayName,
      role: input.role,
      disabled: 0,
      created_at: now(),
    }

    getDb()
      .prepare(
        `INSERT INTO users (id, username, display_name, role, disabled, created_at)
         VALUES (@id, @username, @display_name, @role, @disabled, @created_at)`,
      )
      .run(user)

    return toUser(user)
  },

  byId(id: string): User | null {
    const row = getDb()
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(id) as UserRow | undefined

    return row ? toUser(row) : null
  },

  byUsername(username: string): User | null {
    const row = getDb()
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username) as UserRow | undefined

    return row ? toUser(row) : null
  },

  all(): User[] {
    return (
      getDb()
        .prepare("SELECT * FROM users ORDER BY created_at ASC")
        .all() as UserRow[]
    ).map(toUser)
  },

  setRole(id: string, role: Role): void {
    getDb().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id)
  },

  setDisabled(id: string, disabled: boolean): void {
    getDb()
      .prepare("UPDATE users SET disabled = ? WHERE id = ?")
      .run(disabled ? 1 : 0, id)
  },

  delete(id: string): void {
    getDb().prepare("DELETE FROM users WHERE id = ?").run(id)
  },
}

/* -------------------------- Credentials --------------------------- */

export interface CredentialRecord {
  id: string
  userId: string
  publicKey: Buffer
  counter: number
  transports: string[]
  deviceLabel: string | null
}

export const credentialsRepo = {
  create(input: {
    id: string
    userId: string
    publicKey: Buffer
    counter: number
    transports?: string[]
    deviceLabel?: string
  }): void {
    getDb()
      .prepare(
        `INSERT INTO credentials
           (id, user_id, public_key, counter, transports, device_label, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.id,
        input.userId,
        input.publicKey,
        input.counter,
        JSON.stringify(input.transports ?? []),
        input.deviceLabel ?? null,
        now(),
      )
  },

  byId(id: string): CredentialRecord | null {
    const row = getDb()
      .prepare("SELECT * FROM credentials WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined

    if (!row) {
      return null
    }

    return {
      id: row.id as string,
      userId: row.user_id as string,
      publicKey: row.public_key as Buffer,
      counter: row.counter as number,
      transports: JSON.parse((row.transports as string) || "[]"),
      deviceLabel: (row.device_label as string) ?? null,
    }
  },

  byUser(userId: string): CredentialRecord[] {
    const rows = getDb()
      .prepare("SELECT * FROM credentials WHERE user_id = ?")
      .all(userId) as Record<string, unknown>[]

    return rows.map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      publicKey: row.public_key as Buffer,
      counter: row.counter as number,
      transports: JSON.parse((row.transports as string) || "[]"),
      deviceLabel: (row.device_label as string) ?? null,
    }))
  },

  updateCounter(id: string, counter: number): void {
    getDb()
      .prepare(
        "UPDATE credentials SET counter = ?, last_used_at = ? WHERE id = ?",
      )
      .run(counter, now(), id)
  },
}

/* ---------------------------- Sessions ---------------------------- */

export const sessionsRepo = {
  create(idHash: string, userId: string, ttlMs: number): void {
    const created = new Date()
    const expires = new Date(created.getTime() + ttlMs)

    getDb()
      .prepare(
        `INSERT INTO sessions (id, user_id, created_at, expires_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(idHash, userId, created.toISOString(), expires.toISOString())
  },

  resolve(idHash: string): { userId: string } | null {
    const row = getDb()
      .prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?")
      .get(idHash) as { user_id: string; expires_at: string } | undefined

    if (!row) {
      return null
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      sessionsRepo.delete(idHash)

      return null
    }

    return { userId: row.user_id }
  },

  delete(idHash: string): void {
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(idHash)
  },
}

/* ----------------------------- Invites ---------------------------- */

export const invitesRepo = {
  /**
   * Checks whether an invite is currently valid WITHOUT consuming it. Used
   * at the start of registration to give fast feedback (bad/expired invite)
   * before the passkey ceremony begins — the invite is only actually
   * consumed by `consume()` once the passkey attestation succeeds.
   */
  peek(idHash: string): { role: Role; username: string | null } | null {
    const row = getDb()
      .prepare("SELECT * FROM invites WHERE id = ?")
      .get(idHash) as Record<string, unknown> | undefined

    if (!row || row.used_at) {
      return null
    }

    if (new Date(row.expires_at as string).getTime() < Date.now()) {
      return null
    }

    return { role: row.role as Role, username: (row.username as string) ?? null }
  },

  create(idHash: string, role: Role, ttlMs: number, username?: string): void {
    const created = new Date()
    const expires = new Date(created.getTime() + ttlMs)

    getDb()
      .prepare(
        `INSERT INTO invites (id, role, username, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        idHash,
        role,
        username ?? null,
        created.toISOString(),
        expires.toISOString(),
      )
  },

  consume(idHash: string): { role: Role; username: string | null } | null {
    const row = getDb()
      .prepare("SELECT * FROM invites WHERE id = ?")
      .get(idHash) as Record<string, unknown> | undefined

    if (!row || row.used_at) {
      return null
    }

    if (new Date(row.expires_at as string).getTime() < Date.now()) {
      return null
    }

    getDb().prepare("UPDATE invites SET used_at = ? WHERE id = ?").run(now(), idHash)

    return { role: row.role as Role, username: (row.username as string) ?? null }
  },
}

/* ----------------------------- Quizzes ---------------------------- */

export interface QuizzRow {
  id: string
  ownerId: string
  subject: string
  data: unknown
}

export const quizzesRepo = {
  create(input: { ownerId: string; subject: string; data: unknown }): {
    id: string
  } {
    const id = nanoid()
    const ts = now()

    getDb()
      .prepare(
        `INSERT INTO quizzes (id, owner_id, subject, data, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.ownerId, input.subject, JSON.stringify(input.data), ts, ts)

    return { id }
  },

  update(id: string, input: { subject: string; data: unknown }): void {
    getDb()
      .prepare(
        "UPDATE quizzes SET subject = ?, data = ?, updated_at = ? WHERE id = ?",
      )
      .run(input.subject, JSON.stringify(input.data), now(), id)
  },

  byId(id: string): QuizzRow | null {
    const row = getDb()
      .prepare("SELECT * FROM quizzes WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined

    if (!row) {
      return null
    }

    return {
      id: row.id as string,
      ownerId: row.owner_id as string,
      subject: row.subject as string,
      data: JSON.parse(row.data as string),
    }
  },

  delete(id: string): void {
    getDb().prepare("DELETE FROM quizzes WHERE id = ?").run(id)
  },

  /** Quizzes owned by, or shared with, a user. */
  listForUser(userId: string): (QuizzRow & { permission: Permission | "owner" })[] {
    const rows = getDb()
      .prepare(
        `SELECT q.*, 'owner' AS permission FROM quizzes q WHERE q.owner_id = ?
         UNION
         SELECT q.*, s.permission FROM quizzes q
           JOIN quiz_shares s ON s.quiz_id = q.id
          WHERE s.grantee_id = ?`,
      )
      .all(userId, userId) as Record<string, unknown>[]

    return rows.map((row) => ({
      id: row.id as string,
      ownerId: row.owner_id as string,
      subject: row.subject as string,
      data: JSON.parse(row.data as string),
      permission: row.permission as Permission | "owner",
    }))
  },

  listAll(): QuizzRow[] {
    const rows = getDb()
      .prepare("SELECT * FROM quizzes")
      .all() as Record<string, unknown>[]

    return rows.map((row) => ({
      id: row.id as string,
      ownerId: row.owner_id as string,
      subject: row.subject as string,
      data: JSON.parse(row.data as string),
    }))
  },
}

/* ------------------------------ Shares ---------------------------- */

export const sharesRepo = {
  grant(quizId: string, granteeId: string, permission: Permission): void {
    getDb()
      .prepare(
        `INSERT INTO quiz_shares (quiz_id, grantee_id, permission, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(quiz_id, grantee_id) DO UPDATE SET permission = excluded.permission`,
      )
      .run(quizId, granteeId, permission, now())
  },

  revoke(quizId: string, granteeId: string): void {
    getDb()
      .prepare("DELETE FROM quiz_shares WHERE quiz_id = ? AND grantee_id = ?")
      .run(quizId, granteeId)
  },

  permissionFor(quizId: string, userId: string): Permission | null {
    const row = getDb()
      .prepare(
        "SELECT permission FROM quiz_shares WHERE quiz_id = ? AND grantee_id = ?",
      )
      .get(quizId, userId) as { permission: Permission } | undefined

    return row?.permission ?? null
  },
}

/* ----------------------------- Results ---------------------------- */

export const resultsRepo = {
  create(input: {
    id: string
    quizId: string | null
    ownerId: string
    subject: string
    date: string
    data: unknown
  }): void {
    getDb()
      .prepare(
        `INSERT INTO results (id, quiz_id, owner_id, subject, date, data)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.id,
        input.quizId,
        input.ownerId,
        input.subject,
        input.date,
        JSON.stringify(input.data),
      )
  },

  listForOwner(ownerId: string) {
    return getDb()
      .prepare(
        "SELECT id, subject, date FROM results WHERE owner_id = ? ORDER BY date DESC",
      )
      .all(ownerId) as { id: string; subject: string; date: string }[]
  },

  listAll() {
    return getDb()
      .prepare("SELECT id, subject, date, owner_id FROM results ORDER BY date DESC")
      .all() as { id: string; subject: string; date: string; owner_id: string }[]
  },

  byId(id: string): { ownerId: string; data: unknown } | null {
    const row = getDb()
      .prepare("SELECT owner_id, data FROM results WHERE id = ?")
      .get(id) as { owner_id: string; data: string } | undefined

    return row ? { ownerId: row.owner_id, data: JSON.parse(row.data) } : null
  },

  delete(id: string): void {
    getDb().prepare("DELETE FROM results WHERE id = ?").run(id)
  },
}
