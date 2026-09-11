import { SESSION_ROLES } from "@razzia/common/constants"
import z from "zod"

export const usernameValidator = z
  .string()
  .min(1, "errors:auth.usernameTooShort")
  .max(20, "errors:auth.usernameTooLong")

export const inviteCodeValidator = z
  .string()
  .length(6, "errors:auth.invalidInviteCode")

export const sessionClaimsValidator = z.object({
  sub: z.string().min(1),
  role: z.enum(SESSION_ROLES),
  iat: z.number(),
  exp: z.number(),
})

export const joinTicketClaimsValidator = z.object({
  sub: z.string().min(1),
  gameId: z.string().min(1),
  username: usernameValidator,
  iat: z.number(),
  exp: z.number(),
})

export const managerLoginValidator = z.object({
  password: z.string().min(1, "errors:manager.invalidPassword"),
})

export const sessionRequestValidator = z.object({
  token: z.string().optional(),
})
