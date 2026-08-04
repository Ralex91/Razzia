import type { Socket } from "@razzia/common/types/game/socket"
import {
  registerUser,
  loginUser,
  verifyToken,
  getUserById,
  updateUserProfile,
  logoutUser,
} from "../services/auth"

export const authSocketHandlers = ({ socket }: { socket: Socket }): void => {
  socket.onAny(
    (event: string, data: unknown, callback?: (response: unknown) => void) => {
      if (event === "auth:register" && typeof callback === "function") {
        const authData = data as {
          email: string
          username: string
          password: string
        }
        registerUser({
          email: authData.email,
          username: authData.username,
          password: authData.password,
        })
          .then((user) => {
            callback({ success: true, data: user })
          })
          .catch((error: Error) => {
            callback({ success: false, error: error.message })
          })
      } else if (event === "auth:login" && typeof callback === "function") {
        const authData = data as { email: string; password: string }
        loginUser({
          email: authData.email,
          password: authData.password,
        })
          .then((result) => {
            callback({ success: true, data: result })
          })
          .catch((error: Error) => {
            callback({ success: false, error: error.message })
          })
      } else if (event === "auth:logout" && typeof callback === "function") {
        const authData = data as { token: string }
        if (authData.token) {
          logoutUser(authData.token)
            .then(() => {
              callback({ success: true })
            })
            .catch((error: Error) => {
              callback({ success: false, error: error.message })
            })
        } else {
          callback({ success: true })
        }
      } else if (event === "auth:verify" && typeof callback === "function") {
        const authData = data as { token: string }
        const payload = verifyToken(authData.token)
        if (payload) {
          callback({ success: true, data: { userId: payload.userId } })
        } else {
          callback({ success: false, error: "Invalid token" })
        }
      } else if (
        event === "auth:getProfile" &&
        typeof callback === "function"
      ) {
        const authData = data as { token: string }
        const payload = verifyToken(authData.token)
        if (!payload) {
          callback({ success: false, error: "Invalid token" })
          return
        }

        getUserById(payload.userId)
          .then((user) => {
            if (!user) {
              callback({ success: false, error: "User not found" })
            } else {
              callback({ success: true, data: user })
            }
          })
          .catch((error: Error) => {
            callback({ success: false, error: error.message })
          })
      } else if (
        event === "auth:updateProfile" &&
        typeof callback === "function"
      ) {
        const authData = data as {
          token: string
          username?: string
          email?: string
        }
        const payload = verifyToken(authData.token)
        if (!payload) {
          callback({ success: false, error: "Invalid token" })
          return
        }

        updateUserProfile(payload.userId, {
          username: authData.username,
          email: authData.email,
        })
          .then((user) => {
            callback({ success: true, data: user })
          })
          .catch((error: Error) => {
            callback({ success: false, error: error.message })
          })
      }
    },
  )
}
