import z from "zod"

export const usernameValidator = z
  .string()
  .min(1, "errors:auth.usernameTooShort")
  .max(20, "errors:auth.usernameTooLong")

export const inviteCodeValidator = z
  .string()
  .length(6, "errors:auth.invalidInviteCode")

export const displayNameValidator = z
  .string()
  .min(1, "errors:auth.displayNameTooShort")
  .max(40, "errors:auth.displayNameTooLong")

export const permissionValidator = z.enum(["view", "run", "edit"])

export const roleValidator = z.enum(["admin", "manager"])
