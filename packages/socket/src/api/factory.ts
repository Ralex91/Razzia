import type { SessionClaims } from "@razzia/common/types/auth"
import { createFactory } from "hono/factory"

export interface ApiEnv {
  Variables: {
    claims: SessionClaims
  }
}

export const apiFactory = createFactory<ApiEnv>()
