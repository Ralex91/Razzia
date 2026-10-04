import Background from "@razzia/web/components/Background"
import LanguageSwitcher from "@razzia/web/components/LanguageSwitcher"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { z } from "zod"

const searchSchema = z.object({
  pin: z.coerce.string().optional(),
})

const AuthLayout = () => (
  <Background>
    <div className="absolute top-4 right-4">
      <LanguageSwitcher />
    </div>
    <Outlet />
  </Background>
)

export const Route = createFileRoute("/(auth)")({
  component: AuthLayout,
  validateSearch: searchSchema,
})
