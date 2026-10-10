import { gameSpeed } from "@razzia/socket/env"

export const SECOND_MS = 1000 / gameSpeed

export const sleep = (sec: number) =>
  new Promise((r) => void setTimeout(r, sec * SECOND_MS))

export default sleep
