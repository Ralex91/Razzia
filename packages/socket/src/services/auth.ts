import type sqlite3 from "sqlite3"
import { getDatabase } from "./database"
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import { nanoid } from "nanoid"

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
const TOKEN_EXPIRY = "7d"

export interface UserData {
  id: string
  email: string
  username: string
}

export interface RegisterInput {
  email: string
  username: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export const registerUser = async (input: RegisterInput): Promise<UserData> => {
  const db = getDatabase()

  return new Promise((resolve, reject) => {
    const userId = nanoid()
    const passwordHash = bcryptjs.hashSync(input.password, 10)

    db.run(
      "INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)",
      [userId, input.email, input.username, passwordHash],
      (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to register user: ${err.message}`))
        } else {
          resolve({
            id: userId,
            email: input.email,
            username: input.username,
          })
        }
      },
    )
  })
}

export const loginUser = async (
  input: LoginInput,
): Promise<UserData & { token: string }> => {
  const db = getDatabase()

  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM users WHERE email = ?",
      [input.email],
      (err: Error | null, user: unknown) => {
        if (err) {
          reject(new Error(`Database error: ${err.message}`))
          return
        }

        const userData = user as
          | (UserData & { password_hash: string })
          | undefined
        if (!userData) {
          reject(new Error("Invalid email or password"))
          return
        }

        const isPasswordValid = bcryptjs.compareSync(
          input.password,
          userData.password_hash,
        )
        if (!isPasswordValid) {
          reject(new Error("Invalid email or password"))
          return
        }

        const token = jwt.sign({ userId: userData.id }, JWT_SECRET, {
          expiresIn: TOKEN_EXPIRY,
        })
        const sessionId = nanoid()
        const expiresAt = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString()

        db.run(
          "INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)",
          [sessionId, userData.id, token, expiresAt],
          (err: Error | null) => {
            if (err) {
              reject(new Error(`Failed to create session: ${err.message}`))
            } else {
              resolve({
                id: userData.id,
                email: userData.email,
                username: userData.username,
                token,
              })
            }
          },
        )
      },
    )
  })
}

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded
  } catch {
    return null
  }
}

export const getUserById = (userId: string): Promise<UserData | null> => {
  const db = getDatabase()

  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, email, username FROM users WHERE id = ?",
      [userId],
      (err: Error | null, user: unknown) => {
        if (err) {
          reject(err)
        } else {
          resolve((user as UserData | undefined) || null)
        }
      },
    )
  })
}

export const updateUserProfile = async (
  userId: string,
  updates: { username?: string; email?: string },
): Promise<UserData> => {
  const db = getDatabase()

  return new Promise((resolve, reject) => {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.username) {
      fields.push("username = ?")
      values.push(updates.username)
    }

    if (updates.email) {
      fields.push("email = ?")
      values.push(updates.email)
    }

    if (fields.length === 0) {
      reject(new Error("No updates provided"))
      return
    }

    fields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(userId)

    db.run(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values,
      (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to update profile: ${err.message}`))
        } else {
          getUserById(userId)
            .then((user) => {
              if (user) {
                resolve(user)
              } else {
                reject(new Error("User not found after update"))
              }
            })
            .catch(reject)
        }
      },
    )
  })
}

export const logoutUser = async (token: string): Promise<void> => {
  const db = getDatabase()

  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM sessions WHERE token = ?",
      [token],
      (err: Error | null) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      },
    )
  })
}
