import { zValidator } from "@hono/zod-validator"
import { quizzValidator } from "@razzia/common/validators/quizz"
import { apiFactory } from "@razzia/socket/api/factory"
import { requireManager } from "@razzia/socket/api/middleware"
import { i18nHook } from "@razzia/socket/api/validation"
import {
  deleteQuizz,
  getQuizzById,
  getQuizzMeta,
  saveQuizz,
  updateQuizz,
} from "@razzia/socket/services/config"
import { StatusCodes } from "http-status-codes"

const routes = apiFactory
  .createApp()
  .use(requireManager)
  .get("/", (c) => c.json({ quizz: getQuizzMeta() }))
  .get("/:id", (c) => c.json(getQuizzById(c.req.param("id"))))
  .post("/", zValidator("json", quizzValidator, i18nHook), (c) =>
    c.json(saveQuizz(c.req.valid("json")), StatusCodes.CREATED),
  )
  .patch("/:id", zValidator("json", quizzValidator, i18nHook), (c) =>
    c.json(updateQuizz(c.req.param("id"), c.req.valid("json"))),
  )
  .delete("/:id", (c) => {
    deleteQuizz(c.req.param("id"))

    return c.body(null, StatusCodes.NO_CONTENT)
  })

export const quizz = routes
