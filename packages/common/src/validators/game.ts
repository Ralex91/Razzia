import {
  inviteCodeValidator,
  usernameValidator,
} from "@razzia/common/validators/auth"
import z from "zod"

export const createGameValidator = z.object({
  quizzId: z.string().min(1, "errors:quizz.notFound"),
})

export const checkGameValidator = z.object({
  inviteCode: inviteCodeValidator,
})

export const joinGameValidator = z.object({
  inviteCode: inviteCodeValidator,
  username: usernameValidator,
})
