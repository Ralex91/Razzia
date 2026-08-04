import sqlite3 from "sqlite3"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, "../../config/razzia.db")

let db: sqlite3.Database | null = null

export const getDatabase = (): sqlite3.Database => {
  if (!db) {
    throw new Error("Database not initialized")
  }

  return db
}

export const initDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err: Error | null) => {
      if (err) {
        reject(err)
        return
      }

      db!.serialize(() => {
        db!.run("PRAGMA foreign_keys = ON")

        db!.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `)

        db!.run(`
          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `)

        db!.run(`
          CREATE TABLE IF NOT EXISTS game_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            game_id TEXT NOT NULL,
            score INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `)

        db!.run(
          "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)",
        )
        db!.run(
          "CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id)",
        )
        db!.run(
          "CREATE INDEX IF NOT EXISTS idx_game_history_game_id ON game_history(game_id)",
        )

        resolve()
      })
    })
  })
}

export const closeDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err: Error | null) => {
        if (err) {
          reject(err)
        } else {
          db = null
          resolve()
        }
      })
    } else {
      resolve()
    }
  })
}
