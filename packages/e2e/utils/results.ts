import type { GameResult } from "@razzia/common/types/game"
import { CONFIG_PATH } from "@razzia/e2e/utils/constants"
import fs from "fs"
import { join } from "path"

export const seedResult = (result: Omit<GameResult, "id" | "date">) => {
  const dir = join(CONFIG_PATH, "results")
  const id = result.subject.toLowerCase().replace(/\W+/gu, "-")

  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    join(dir, `${id}.json`),
    JSON.stringify({ id, date: new Date().toISOString(), ...result }),
  )
}
