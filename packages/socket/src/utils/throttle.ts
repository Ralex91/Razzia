export const BROADCAST_INTERVAL_MS = 250

export interface Throttled {
  (): void
  cancel: () => void
}

export const throttle = (
  fn: () => void,
  intervalMs = BROADCAST_INTERVAL_MS,
): Throttled => {
  let timer: NodeJS.Timeout | null = null
  let pending = false

  const run = () => {
    if (timer) {
      pending = true

      return
    }

    fn()

    timer = setTimeout(() => {
      timer = null

      if (pending) {
        pending = false
        run()
      }
    }, intervalMs)
  }

  return Object.assign(run, {
    cancel: () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }

      pending = false
    },
  })
}
