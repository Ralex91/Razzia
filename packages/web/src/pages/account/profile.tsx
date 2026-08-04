import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import Background from "@razzia/web/components/Background"
import { useAuth } from "@razzia/web/features/auth/contexts/auth-context"

const ProfilePage = () => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()
  const { user, logout, updateProfile, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/account/login" })
      return
    }
    if (user) {
      setUsername(user.username)
      setEmail(user.email)
    }
  }, [user, isAuthenticated, navigate])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateProfile({ username, email })
      toast.success(t("Profile updated successfully"))
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success(t("Logged out successfully"))
      navigate({ to: "/account/login" })
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (!user) {
    return (
      <Background>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-white">{t("common:loading")}</p>
        </div>
      </Background>
    )
  }

  return (
    <Background>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="text-primary mb-6 text-center text-3xl font-bold">
            {t("Profile")}
          </h1>

          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {t("Username")}
                </p>
                <p className="text-lg text-gray-900">{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {t("Email")}
                </p>
                <p className="text-lg text-gray-900">{user.email}</p>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="bg-primary mt-6 w-full rounded-lg px-4 py-2 font-bold text-white hover:opacity-90"
              >
                {t("Edit Profile")}
              </button>

              <button
                onClick={handleLogout}
                className="w-full rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:opacity-90"
              >
                {t("Logout")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("Username")}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-primary mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("Email")}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-primary mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary flex-1 rounded-lg px-4 py-2 font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? t("common:loading") : t("Save")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 rounded-lg bg-gray-300 px-4 py-2 font-bold text-gray-700 hover:opacity-90"
                >
                  {t("Cancel")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Background>
  )
}

export const Route = createFileRoute("/account/profile")({
  component: ProfilePage,
})
