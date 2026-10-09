import {
  test as base,
  expect,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
} from "@playwright/test"

type NewPage = (options?: BrowserContextOptions) => Promise<Page>

export const closePage = async (page: Page) => {
  if (page.isClosed()) {
    return
  }

  await Promise.all([
    page.waitForEvent("close"),
    page.close({ runBeforeUnload: true }),
  ])
}

const closeContext = async (context: BrowserContext) => {
  await Promise.all(context.pages().map(closePage))
  await context.close()
}

export const test = base.extend<{ newPage: NewPage }>({
  context: async ({ context }, use) => {
    await use(context)
    await Promise.all(context.pages().map(closePage))
  },
  newPage: async ({ browser }, use) => {
    const contexts: BrowserContext[] = []

    await use(async (options) => {
      const context = await browser.newContext(options)

      contexts.push(context)

      return context.newPage()
    })

    await Promise.all(contexts.map(closeContext))
  },
})

export { expect }
