// Minimal in-memory fixed-window rate limiter for Socket.IO events (which
// @fastify/rate-limit does not cover — that plugin only sees HTTP requests).
// Good enough for a single-container deployment; swap for a shared store
// (e.g. Redis) if this service is ever scaled horizontally.

interface Window {
  count: number
  resetAt: number
}

const windows = new Map<string, Window>()

// Periodically drop stale windows so this map can't grow unbounded.
const SWEEP_INTERVAL = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()

  for (const [key, w] of windows) {
    if (w.resetAt < now) {
      windows.delete(key)
    }
  }
}, SWEEP_INTERVAL).unref?.()

/**
 * Returns true if `key` has exceeded `max` calls within the trailing
 * `windowMs` window, and records this call either way.
 */
export const isRateLimited = (key: string, max: number, windowMs: number): boolean => {
  const now = Date.now()
  const existing = windows.get(key)

  if (!existing || existing.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })

    return false
  }

  existing.count += 1

  return existing.count > max
}
