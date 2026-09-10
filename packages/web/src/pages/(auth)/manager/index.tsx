import ManagerPassword from "@razzia/web/features/manager/components/ManagerPassword"
import { managerLogin } from "@razzia/web/features/manager/queries"
import { ApiError } from "@razzia/web/lib/api"
import { setToken } from "@razzia/web/lib/session"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const ManagerAuthPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { mutate, isPending } = useMutation({
    mutationFn: managerLogin,
    onSuccess: (session) => {
      setToken(session.token)
      navigate({ to: "/manager/config" })
    },
    onError: (error) => {
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:route.description"),
      )
    },
  })

  return <ManagerPassword onSubmit={mutate} disabled={isPending} />
}

export const Route = createFileRoute("/(auth)/manager/")({
  component: ManagerAuthPage,
})
