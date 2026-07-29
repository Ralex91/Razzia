import Database from "better-sqlite3"
import fs from "fs"
import { resolve } from "path"

import { SCHEMA_SQL } from "./schema"

const inContainerPath = process.env.CONFIG_PATH

const getConfigPath = (path = "") =>
  inContainerPath
    ? resolve(inContainerPath, path)
    : resolve(process.cwd(), "../../config", path)

let db: Database.Database | null = null

/**
 * Opens (and lazily migrates) the SQLite database that backs users,
 * credentials, sessions, quizzes, sharing and results.
 */
export const getDb = (): Database.Database => {
  if (db) {
    return db
  }

  const configDir = getConfigPath()

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  db = new Database(getConfigPath("razzia.db"))
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")

  runMigrations(db)

  return db
}

const runMigrations = (database: Database.Database): void => {
  // Schema is inlined (see schema.ts) so it survives esbuild bundling and
  // needs no runtime file lookup. CREATE TABLE IF NOT EXISTS makes it idempotent.
  database.exec(SCHEMA_SQL)
}

export const closeDb = (): void => {
  db?.close()
  db = null
}
