import { useCallback, useEffect, useState } from "react"

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(
    () => document.fullscreenElement !== null,
  )

  useEffect(() => {
    const listener = () => setIsFullscreen(document.fullscreenElement !== null)

    document.addEventListener("fullscreenchange", listener)

    return () => document.removeEventListener("fullscreenchange", listener)
  }, [])

  const toggle = useCallback(() => {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen()

    request.catch(() => {
      // The browser can refuse the request, keep the current state
    })
  }, [])

  return { isFullscreen, toggle }
}
