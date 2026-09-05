import manager from "@razzia/socket/services/manager"
import type { NextFunction, Request, Response } from "express"

// `X-Client-Id` is the socket handshake's `clientId`; scheme: ADR-0001 amendment.
export const requireManager = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const clientId = req.get("X-Client-Id")

  if (!clientId || !manager.isClientLogged(clientId)) {
    res.status(401).json({ error: "Unauthorized" })

    return
  }

  next()
}
