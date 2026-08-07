import defaultLogo from "@razzia/web/assets/logo.svg"
import { getBranding, imageFallback } from "@razzia/web/branding"
import type { PropsWithChildren } from "react"

const Background = ({ children }: PropsWithChildren) => {
  const branding = getBranding()
  const logo = branding?.logo ?? defaultLogo
  const appName = branding?.appName ?? "Razzia"

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center">
      <div className="absolute h-full max-h-svh w-full overflow-hidden">
        <div className="bg-primary/15 absolute top-[-70vmin] left-[-50vmin] min-h-[120vmin] min-w-[120vmin] rotate-20 rounded-4xl" />
        <div className="bg-primary/15 absolute right-[-10vmin] bottom-[-45vmin] min-h-[75vmin] min-w-[75vmin] rotate-20 rounded-4xl" />
      </div>

      <img
        src={logo}
        onError={imageFallback(defaultLogo)}
        className="mb-10 h-16"
        alt={appName}
      />
      {children}
    </section>
  )
}

export default Background
