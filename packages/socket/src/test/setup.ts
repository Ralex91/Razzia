import fs from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterAll, vi } from "vitest"

const configPath = fs.mkdtempSync(join(tmpdir(), "razzia-test-"))

process.env.CONFIG_PATH = configPath

vi.spyOn(console, "log").mockImplementation(() => undefined)
vi.spyOn(console, "warn").mockImplementation(() => undefined)

afterAll(() => {
  fs.rmSync(configPath, { recursive: true, force: true })
})
