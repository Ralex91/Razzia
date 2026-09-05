import { isSessionExpired } from "@razzia/web/features/quizz/api/media"
import { useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

// Mirrors the MANAGER.UNAUTHORIZED socket handler: back to the password screen.
export const useSessionExpiredRedirect = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useCallback(
    (error: unknown): boolean => {
      if (!isSessionExpired(error)) {
        return false
      }

      toast.error(t("errors:media.unauthorized"))
      navigate({ to: "/manager" })

      return true
    },
    [navigate, t],
  )
}
