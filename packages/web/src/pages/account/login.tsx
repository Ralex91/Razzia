import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import Background from "@razzia/web/components/Background"
import { useAuth } from "@razzia/web/features/auth/contexts/auth-context"
import { useSocket } from "@razzia/web/features/game/contexts/socket-context"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const { isConnected } = useSocket()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) {
      toast.error(t("common:error"))
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      toast.success(t("common:success"))
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
            {t("Login")}
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

            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary mt-6 w-full rounded-lg px-4 py-2 font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? t("common:loading") : t("Login")}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-600">
              {t("Don't have an account?")}{" "}
              <a
                href="/account/register"
                className="text-primary font-bold hover:underline"
              >
                {t("Register")}
              </a>
            </p>
          </div>
        </div>
      </div>
    </Background>
  )
}

export const Route = createFileRoute("/account/login")({
  component: LoginPage,
})
