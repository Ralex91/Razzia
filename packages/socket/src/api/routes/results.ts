import { apiFactory } from "@razzia/socket/api/factory"
import { requireManager } from "@razzia/socket/api/middleware"
import {
  deleteResult,
  getResultById,
  getResultsMeta,
} from "@razzia/socket/services/config"
import { StatusCodes } from "http-status-codes"

const routes = apiFactory
  .createApp()
  .use(requireManager)
  .get("/", (c) => c.json({ results: getResultsMeta() }))
  .get("/:id", (c) => c.json(getResultById(c.req.param("id"))))
  .delete("/:id", (c) => {
    deleteResult(c.req.param("id"))

    return c.body(null, StatusCodes.NO_CONTENT)
  })

export const results = routes
