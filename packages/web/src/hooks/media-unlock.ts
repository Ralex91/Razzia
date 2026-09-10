// Safari (and iOS) only lets a media element play with sound if that very
// element was first played inside a user gesture; Chrome and Firefox unlock
// the whole document instead. Question media is therefore played through
// shared elements that are "unlocked" on the first gesture of the page.

const SILENT_WAV =
  "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=="

const shared = {
  audio: document.createElement("audio"),
  video: document.createElement("video"),
}

const claimed = new Set<HTMLMediaElement>()

let unlocked = false

const unlock = async (element: HTMLMediaElement): Promise<void> => {
  // Already mounted with real media: this gesture is the chance to start it.
  if (claimed.has(element)) {
    if (element.paused) {
      await element.play().catch(() => undefined)
    }

    return
  }

  element.src = SILENT_WAV

  try {
    await element.play()
  } catch {
    // Blocked anyway: the element stays locked, play() will fail later.
  } finally {
    // A component may have claimed the element meanwhile: leave it alone.
    if (!claimed.has(element)) {
      element.pause()
      element.removeAttribute("src")
      element.load()
    }
  }
}

const unlockAll = () => {
  if (unlocked) {
    return
  }

  unlocked = true
  void unlock(shared.audio)
  void unlock(shared.video)
}

export const installMediaUnlock = (): void => {
  for (const type of ["pointerdown", "keydown", "touchend"]) {
    document.addEventListener(type, unlockAll, { capture: true, once: true })
  }
}

/**
 * Takes the shared element for a component. The source is only reassigned
 * when it changes: a reload aborts any pending play() and drops the loaded
 * duration, and the same clip is remounted on the answer screen.
 */
export const acquireMediaElement = <K extends keyof typeof shared>(
  kind: K,
  src: string,
): (typeof shared)[K] => {
  const element = shared[kind]

  claimed.add(element)

  if (element.getAttribute("src") !== src) {
    element.src = src
  } else {
    element.currentTime = 0
  }

  return element
}

export const releaseMediaElement = (element: HTMLMediaElement): void => {
  element.pause()
  element.remove()
  claimed.delete(element)
}
