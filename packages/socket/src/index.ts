import { createAdaptorServer } from "@hono/node-server"
import { app, createSocketServer } from "@razzia/socket/app"
import { initConfig } from "@razzia/socket/services/config"
import Registry from "@razzia/socket/services/registry"

const WS_PORT = Number(process.env.SOCKET_PORT) || 3001

initConfig()

const server = createAdaptorServer({ fetch: app.fetch })

createSocketServer(server)

server.listen(WS_PORT, () => {
  console.log(`Server running on port ${WS_PORT}`)
})

process.on("SIGINT", () => {
  Registry.getInstance().cleanup()
  process.exit(0)
})

process.on("SIGTERM", () => {
  Registry.getInstance().cleanup()
  process.exit(0)
})
