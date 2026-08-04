import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import Background from "@razzia/web/components/Background"
import { useAuth } from "@razzia/web/features/auth/contexts/auth-context"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"

const RegisterPage = () => {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const { isConnected } = useSocket()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) {
      toast.error(t("common:error"))
      return
    }

    if (password !== confirmPassword) {
      toast.error(t("Passwords don't match"))
      return
    }

    if (password.length < 6) {
      toast.error(t("Password must be at least 6 characters"))
      return
    }

    setIsLoading(true)
    try {
      await register(email, username, password)
      await login(email, password)
      toast.success(t("Account created successfully"))
      navigate({ to: "/account/profile" })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Background>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="text-primary mb-6 text-center text-3xl font-bold">
            {t("Register")}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="you@example.com"
              />
            </div>

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
                placeholder="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("Password")}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus:ring-primary mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("Confirm Password")}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="focus:ring-primary mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary mt-6 w-full rounded-lg px-4 py-2 font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? t("common:loading") : t("Register")}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-600">
              {t("Already have an account?")}{" "}
              <a
                href="/account/login"
                className="text-primary font-bold hover:underline"
              >
                {t("Login")}
              </a>
            </p>
          </div>
        </div>
      </div>
    </Background>
  )
}

export const Route = createFileRoute("/account/register")({
  component: RegisterPage,
})
