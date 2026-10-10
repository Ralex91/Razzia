import { CONFIG_PATH } from "@razzia/e2e/utils/constants"
import fs from "fs"
import { join } from "path"

export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
)

const createWav = () => {
  const header = Buffer.alloc(44)

  header.write("RIFF", 0)
  header.writeUInt32LE(36, 4)
  header.write("WAVE", 8)
  header.write("fmt ", 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(8000, 24)
  header.writeUInt32LE(8000, 28)
  header.writeUInt16LE(1, 32)
  header.writeUInt16LE(8, 34)
  header.write("data", 36)
  header.writeUInt32LE(0, 40)

  return header
}

export const WAV = createWav()

export const pngFile = (name: string) => ({
  name: `${name}.png`,
  mimeType: "image/png",
  buffer: PNG,
})

export const wavFile = (name: string) => ({
  name: `${name}.wav`,
  mimeType: "audio/wav",
  buffer: WAV,
})

export const listMediaFiles = () => {
  const dir = join(CONFIG_PATH, "media")

  return fs.existsSync(dir) ? fs.readdirSync(dir) : []
}
