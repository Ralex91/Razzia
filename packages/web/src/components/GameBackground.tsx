import defaultBackground from "@razzia/web/assets/background.png"
import { getBranding, imageFallback } from "@razzia/web/branding"

const GameBackground = () => {
  const background = getBranding()?.background ?? defaultBackground

  return (
    <div className="fixed top-0 left-0 h-full w-full">
      <img
        className="pointer-events-none h-full w-full object-cover select-none"
        src={background}
        onError={imageFallback(defaultBackground)}
        alt="background"
      />
    </div>
  )
}

export default GameBackground
