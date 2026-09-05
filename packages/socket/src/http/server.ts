import { mediaRouter } from "@razzia/socket/http/media"
import express, { type Express } from "express"

export const createApp = (): Express => {
  const app = express()

  app.disable("x-powered-by")
  app.use("/api", mediaRouter)

  return app
}
