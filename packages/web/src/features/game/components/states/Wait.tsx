import { useTranslation } from "react-i18next"
import type { PlayerStatusDataMap } from "@razzia/common/types/game/status"
import Loader from "@razzia/web/components/Loader"

interface Props {
  data: PlayerStatusDataMap["WAIT"]
}

const Wait = ({ data: { text } }: Props) => {
  const { t } = useTranslation()

  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center">
      <Loader className="h-30" />
      <h2 className="mt-5 text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
        {t(text)}
      </h2>
    </section>
  )
}

export default Wait
