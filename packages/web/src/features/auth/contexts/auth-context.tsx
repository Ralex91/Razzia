import React, { createContext, useContext, useState, useEffect } from "react"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"

export interface User {
  id: string
  email: string
  username: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  register: (email: string, username: string, password: string) => Promise<User>
  login: (
    email: string,
    password: string,
  ) => Promise<User & { token: string }>
  logout: () => Promise<void>
  updateProfile: (updates: {
    username?: string
    email?: string
  }) => Promise<User>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token"),
  )
  const [isLoading, setIsLoading] = useState(true)
  const { socket } = useSocket()

  useEffect(() => {
    const verifyToken = async (): Promise<void> => {
      if (token && socket) {
        try {
          const verifyResponse = await new Promise<{
            success: boolean
            data?: unknown
            error?: string
          }>((resolve) => {
            socket.emit("auth:verify", { token }, (res) => {
              resolve(res)
            })
          })

          if (verifyResponse.success) {
            const profileResponse = await new Promise<{
              success: boolean
              data?: User
              error?: string
            }>((resolve) => {
              socket.emit("auth:getProfile", { token }, (res) => {
                resolve(res)
              })
            })

            if (profileResponse.success && profileResponse.data) {
              setUser(profileResponse.data)
            } else {
              setToken(null)
              localStorage.removeItem("auth_token")
            }
          } else {
            setToken(null)
            localStorage.removeItem("auth_token")
          }
        } catch (error) {
          console.error("Token verification failed:", error)
          setToken(null)
          localStorage.removeItem("auth_token")
        }
      }

      setIsLoading(false)
    }

    void verifyToken()
  }, [token, socket])

  const register = async (
    email: string,
    username: string,
    password: string,
  ): Promise<User> => {
    if (!socket) {
      throw new Error("Socket not connected")
    }

    return new Promise((resolve, reject) => {
      socket.emit(
        "auth:register",
        { email, username, password },
        (res: unknown) => {
          const response = res as { success: boolean; data?: User; error?: string }
          if (response.success && response.data) {
            resolve(response.data)
          } else {
            reject(new Error(response.error || "Registration failed"))
          }
        },
      )
    })
  }

  const login = async (
    email: string,
    password: string,
  ): Promise<User & { token: string }> => {
    if (!socket) {
      throw new Error("Socket not connected")
    }

    return new Promise((resolve, reject) => {
      socket.emit("auth:login", { email, password }, (res: unknown) => {
        const response = res as {
          success: boolean
          data?: User & { token: string }
          error?: string
        }
        if (response.success && response.data) {
          const { token: newToken, ...userData } = response.data
          setToken(newToken)
          setUser(userData)
          localStorage.setItem("auth_token", newToken)
          resolve(response.data)
        } else {
          reject(new Error(response.error || "Login failed"))
        }
      })
    })
  }

  const logout = async (): Promise<void> => {
    if (!socket) {
      throw new Error("Socket not connected")
    }

    return new Promise((resolve, reject) => {
      socket.emit("auth:logout", { token }, (res: unknown) => {
        const response = res as { success: boolean; error?: string }
        if (response.success) {
          setUser(null)
          setToken(null)
          localStorage.removeItem("auth_token")
          resolve()
        } else {
          reject(new Error(response.error || "Logout failed"))
        }
      })
    })
  }

  const updateProfile = async (updates: {
    username?: string
    email?: string
  }): Promise<User> => {
    if (!socket) {
      throw new Error("Socket not connected")
    }

    if (!token) {
      throw new Error("Not authenticated")
    }

    return new Promise((resolve, reject) => {
      socket.emit(
        "auth:updateProfile",
        { token, ...updates },
        (res: unknown) => {
          const response = res as { success: boolean; data?: User; error?: string }
          if (response.success && response.data) {
            setUser(response.data)
            resolve(response.data)
          } else {
            reject(new Error(response.error || "Update failed"))
          }
        },
      )
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        register,
        login,
        logout,
        updateProfile,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
