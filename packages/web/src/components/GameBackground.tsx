import defaultBackground from "@razzia/web/assets/background.png"
import { getBranding } from "@razzia/web/branding"
import BackgroundImage from "@razzia/web/components/BackgroundImage"

const GameBackground = () => {
  const background = getBranding()?.background ?? defaultBackground

  return (
    <div className="fixed top-0 left-0 h-full w-full">
      <BackgroundImage src={background} />
    </div>
  )
}

export default GameBackground
