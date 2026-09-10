import type { Context } from "hono"
import { StatusCodes } from "http-status-codes"

export const i18nHook = (
  result: {
    success: boolean
    error?: { issues: Array<{ message: string }> }
  },
  c: Context,
) => {
  if (result.success) {
    return undefined
  }

  return c.json(
    { error: result.error?.issues[0].message ?? "errors:invalidRequest" },
    StatusCodes.BAD_REQUEST,
  )
}
