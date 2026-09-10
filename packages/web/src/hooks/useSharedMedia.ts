import {
  acquireMediaElement,
  releaseMediaElement,
} from "@razzia/web/hooks/media-unlock"
import { type RefObject, useEffect, useLayoutEffect, useRef } from "react"

interface Options {
  src: string
  autoPlay: boolean
  className?: string
  controls?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (_currentTime: number) => void
  onLoadedMetadata?: (_duration: number) => void
}

type Kind = "audio" | "video"

/**
 * Mounts the shared (autoplay-unlocked) audio/video element into `container`
 * for the lifetime of the component. Handlers are read through a ref so the
 * element is wired once per `src`.
 */
export const useSharedMedia = <K extends Kind>(
  kind: K,
  container: RefObject<HTMLElement | null>,
  options: Options,
): RefObject<ReturnType<typeof acquireMediaElement<K>> | null> => {
  const elementRef = useRef<ReturnType<typeof acquireMediaElement<K>>>(null)
  const handlers = useRef(options)

  useEffect(() => {
    handlers.current = options
  })

  const { src, autoPlay, className, controls } = options

  useLayoutEffect(() => {
    const host = container.current

    if (!host) {
      return
    }

    const element = acquireMediaElement(kind, src)
    elementRef.current = element

    element.className = className ?? ""
    element.controls = controls ?? false
    element.preload = "metadata"
    host.append(element)

    // The clip may already be loaded from a previous mount (same src).
    if (Number.isFinite(element.duration) && element.duration > 0) {
      handlers.current.onLoadedMetadata?.(element.duration)
    }

    const listeners: Record<string, () => void> = {
      play: () => handlers.current.onPlay?.(),
      pause: () => handlers.current.onPause?.(),
      ended: () => handlers.current.onEnded?.(),
      timeupdate: () => handlers.current.onTimeUpdate?.(element.currentTime),
      loadedmetadata: () =>
        handlers.current.onLoadedMetadata?.(element.duration),
    }

    for (const [event, listener] of Object.entries(listeners)) {
      element.addEventListener(event, listener)
    }

    if (autoPlay) {
      element.play().catch((error: unknown) => {
        console.warn("Media autoplay blocked", error)
      })
    }

    return () => {
      for (const [event, listener] of Object.entries(listeners)) {
        element.removeEventListener(event, listener)
      }

      releaseMediaElement(element)
      elementRef.current = null
    }
  }, [kind, container, src, autoPlay, className, controls])

  return elementRef
}
