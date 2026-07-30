import { EXAMPLE_QUIZZ } from "@razzia/common/constants"
import { quizzValidator } from "@razzia/common/validators/quizz"
import {
  invitesRepo,
  quizzesRepo,
  resultsRepo,
  usersRepo,
} from "@razzia/socket/db/repositories"
import crypto from "crypto"
import fs from "fs"
import { join, resolve } from "path"

const inContainerPath = process.env.CONFIG_PATH
const getPath = (p = "") =>
  inContainerPath
    ? resolve(inContainerPath, p)
    : resolve(process.cwd(), "../../config", p)

const hash = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex")

const INVITE_TTL = 1000 * 60 * 60 * 24 * 7 // 7 days

/** Creates a one-time admin invite and prints the registration link to logs. */
const createBootstrapInvite = (): void => {
  const token =
    process.env.ADMIN_BOOTSTRAP_TOKEN ?? crypto.randomBytes(24).toString("base64url")

  invitesRepo.create(hash(token), "admin", INVITE_TTL)

  console.log(
    "\n=== Razzia first-run setup ===\n" +
      "No users exist yet. Register the global admin passkey at:\n" +
      `  /register?invite=${token}\n` +
      "This token is valid for 7 days and can be used once.\n" +
      "==============================\n",
  )
}

/** Imports legacy file-based quizzes/results under the given owner (non-destructive). */
const importLegacyFiles = (ownerId: string): void => {
  const quizzDir = getPath("quizz")

  if (fs.existsSync(quizzDir)) {
    // Content signature for a quiz (subject + its questions). Two legacy files
    // that describe the same quiz collapse to the same signature, so a re-run
    // — or a file that was already imported earlier — can never be inserted
    // twice. This makes the import safe to call more than once.
    const signature = (subject: string, questions: unknown): string =>
      `${subject}\u0000${JSON.stringify(questions)}`

    const seen = new Set(
      quizzesRepo
        .listAll()
        .map((q) =>
          signature(q.subject, (q.data as { questions: unknown }).questions),
        ),
    )

    let imported = 0

    for (const file of fs.readdirSync(quizzDir)) {
      if (!file.endsWith(".json")) {
        continue
      }

      try {
        const raw = JSON.parse(fs.readFileSync(join(quizzDir, file), "utf-8"))
        const parsed = quizzValidator.safeParse(raw)

        if (!parsed.success) {
          continue
        }

        const sig = signature(parsed.data.subject, parsed.data.questions)

        // Already present (from a prior import or an identical file) — skip.
        if (seen.has(sig)) {
          continue
        }

        quizzesRepo.create({
          ownerId,
          subject: parsed.data.subject,
          data: { questions: parsed.data.questions },
        })
        seen.add(sig)
        imported += 1
      } catch (error) {
        console.warn(`Skipped legacy quiz "${file}":`, error)
      }
    }

    console.log(`Imported ${imported} legacy quiz(zes) from config/quizz`)
  }

  const resultsDir = getPath("results")

  if (fs.existsSync(resultsDir)) {
    for (const file of fs.readdirSync(resultsDir)) {
      if (!file.endsWith(".json")) {
        continue
      }

      try {
        const data = JSON.parse(fs.readFileSync(join(resultsDir, file), "utf-8"))

        // Results carry a stable id (their primary key); skip any already
        // imported so a re-run does not error out or duplicate.
        if (resultsRepo.byId(data.id)) {
          continue
        }

        resultsRepo.create({
          id: data.id,
          quizId: null,
          ownerId,
          subject: data.subject,
          date: data.date,
          data,
        })
      } catch (error) {
        console.warn(`Skipped legacy result "${file}":`, error)
      }
    }
  }
}

/**
 * Runs once at startup. If the users table is empty, emits an admin invite.
 * Legacy file import is deferred until the admin account exists (see
 * completeBootstrap), so quizzes get a real owner.
 */
export const bootstrap = (): void => {
  if (usersRepo.count() === 0) {
    createBootstrapInvite()
  }
}

/** Called right after the first (admin) user registers. */
export const completeBootstrap = (adminId: string): void => {
  importLegacyFiles(adminId)

  // Seed an example quiz for a brand-new instance with no legacy files.
  if (quizzesRepo.listAll().length === 0) {
    quizzesRepo.create({
      ownerId: adminId,
      subject: EXAMPLE_QUIZZ.subject,
      data: { questions: EXAMPLE_QUIZZ.questions },
    })
  }
}
