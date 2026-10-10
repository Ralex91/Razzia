# Testing

Razzia has two test suites:

- **Unit and integration tests** with [Vitest](https://vitest.dev), next to the code they test (`*.test.ts`).
- **End-to-end tests** with [Playwright](https://playwright.dev), in the `packages/e2e` package.

## Commands

Run them from the repository root:

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `pnpm test`          | Run the unit and integration tests           |
| `pnpm test:watch`    | Run them in watch mode                       |
| `pnpm test:coverage` | Run them with a coverage report              |
| `pnpm test:e2e`      | Run the e2e tests                            |
| `pnpm test:e2e:ui`   | Open the Playwright UI to run and debug them |

Before the first e2e run, install the browser:

```bash
pnpm --filter @razzia/e2e exec playwright install chromium
```

## Unit and integration tests

The Vitest config lives in `vitest.config.ts` and splits the tests into three projects: `common`, `socket` and `web`. Run a single one with `pnpm test --project socket`.

- **common**: validators and shared question logic.
- **socket**: the game, scoring, auth, config and media services, the HTTP API and the socket handlers.
- **web**: pure frontend logic (questions, session) and the translations.

### Server tests

- `packages/socket/src/test/setup.ts` gives each test file its own temporary `CONFIG_PATH`, so tests never touch the real `config` folder.
- `packages/socket/src/test/fixtures.ts` builds quizzes, questions and players.
- `packages/socket/src/test/fake-io.ts` records what the game emits, to test the game logic without a real socket server.
- The HTTP API is tested through `app.request()`, without starting a server.
- The socket handlers are tested against a real server built with `createSocketServer()` from `app.ts`, with `socket.io-client`.

The server returns translation keys (`errors:game.notFound`), not texts, so tests check the keys.

## End-to-end tests

```
packages/e2e
├── fixtures/quizz/   # quizzes copied into the test config before each run
├── tests/            # one spec per feature
└── utils/            # helpers shared by the specs
```

`pnpm test:e2e` starts its own servers, so nothing else needs to run:

- the socket server on port `3001`, with a fresh config in `packages/e2e/.config` and `GAME_SPEED=10` so timers run 10 times faster;
- the built web app with `vite preview` on port `3000`.

Ports `3000` and `3001` must be free.

### Writing a test

- Import `test` and `expect` from `@razzia/e2e/utils/fixtures`. The `newPage()` fixture opens a page in a new browser context, so each player has its own session. Every page is closed at the end of the test.
- Use the helpers from `utils`, such as `createGame`, `joinGame`, `answer` or `startGame`, instead of repeating the steps.
- Find elements by role, label or text, never by CSS class.
- Use the `t()` helper from `@razzia/e2e/utils/i18n` for every UI text. It reads the app's locales, so tests keep working when a text changes.

```ts
import { BASIC_QUIZZ } from "@razzia/e2e/utils/constants"
import { expect, test } from "@razzia/e2e/utils/fixtures"
import { t } from "@razzia/e2e/utils/i18n"
import { createGame, startGame } from "@razzia/e2e/utils/manager"
import { answer, joinGame } from "@razzia/e2e/utils/player"

test("scores a right answer", async ({ page: manager, newPage }) => {
  const pin = await createGame(manager)
  const player = await newPage()

  await joinGame(player, pin, "Alice")
  await startGame(manager)
  await expect(player.getByText(BASIC_QUIZZ)).toBeVisible()

  await answer(player, "Paris")
  await expect(player.getByText(t("game:correct"))).toBeVisible()
})
```

Keep e2e tests for what needs a browser and several clients. Logic that can be checked without the UI, like scoring or validation, belongs in the unit tests.

## CI

`.github/workflows/ci.yml` runs on every pull request:

- **Lint & Format**: `pnpm format` and `pnpm lint`.
- **Tests**: the build, then the unit and integration tests.
- **E2E Tests**: the Playwright tests. When a test fails, the traces are uploaded as the `playwright-traces` artifact. Open one with `pnpm --filter @razzia/e2e exec playwright show-trace <trace.zip>`.
