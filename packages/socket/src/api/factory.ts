import { createFactory } from "hono/factory"
import type { SessionClaims } from "@razzia/common/types/auth"

export interface ApiEnv {
  Variables: {
    claims: SessionClaims
  }
}

export const apiFactory = createFactory<ApiEnv>()
