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
    for (const file of fs.readdirSync(quizzDir)) {
      if (!file.endsWith(".json")) {
        continue
      }

      try {
        const raw = JSON.parse(fs.readFileSync(join(quizzDir, file), "utf-8"))
        const parsed = quizzValidator.safeParse(raw)

        if (parsed.success) {
          quizzesRepo.create({
            ownerId,
            subject: parsed.data.subject,
            data: { questions: parsed.data.questions },
          })
        }
      } catch (error) {
        console.warn(`Skipped legacy quiz "${file}":`, error)
      }
    }

    console.log("Imported legacy quizzes from config/quizz")
  }

  const resultsDir = getPath("results")

  if (fs.existsSync(resultsDir)) {
    for (const file of fs.readdirSync(resultsDir)) {
      if (!file.endsWith(".json")) {
        continue
      }

      try {
        const data = JSON.parse(fs.readFileSync(join(resultsDir, file), "utf-8"))
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
