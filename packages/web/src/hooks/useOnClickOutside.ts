import { type RefObject, useEffect } from "react"

type EventType =
  | "mousedown"
  | "mouseup"
  | "touchstart"
  | "touchend"
  | "focusin"
  | "focusout"

interface Options {
  ref: RefObject<HTMLElement | null> | Array<RefObject<HTMLElement | null>>
  handler: (_event: MouseEvent | TouchEvent | FocusEvent) => void
  eventType?: EventType
  eventListenerOptions?: AddEventListenerOptions
}

export const useOnClickOutside = <T extends HTMLElement = HTMLElement>({
  ref,
  handler,
  eventType = "mousedown",
  eventListenerOptions = {},
}: Options & { ref: RefObject<T | null> | Array<RefObject<T | null>> }) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent | FocusEvent) => {
      const target = event.target as Node

      if (!target.isConnected) {
        return
      }

      const isOutside = Array.isArray(ref)
        ? ref
            .filter((r) => Boolean(r.current))
            .every((r) => r.current && !r.current.contains(target))
        : ref.current && !ref.current.contains(target)

      if (isOutside) {
        handler(event)
      }
    }

    document.addEventListener(
      eventType,
      listener as EventListener,
      eventListenerOptions,
    )

    return () => {
      document.removeEventListener(
        eventType,
        listener as EventListener,
        eventListenerOptions,
      )
    }
  }, [ref, handler, eventType, eventListenerOptions])
}
