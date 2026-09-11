import defaultBackground from "@razzia/web/assets/background.png"
import { imageFallback } from "@razzia/web/branding"

const BackgroundImage = ({ src }: { src: string }) => (
  <img
    className="pointer-events-none h-full w-full object-cover select-none"
    src={src}
    onError={imageFallback(defaultBackground)}
    alt="background"
  />
)

export default BackgroundImage
