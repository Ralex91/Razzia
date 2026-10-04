import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import PreparedAnswers from "@razzia/web/features/game/components/PreparedAnswers"
import { QUESTION_REGISTRY } from "@razzia/web/features/questions"
import { useTranslation } from "react-i18next"

interface Props {
  data: CommonStatusDataMap["SHOW_PREPARED"]
}

const Prepared = ({
  data: { totalAnswers, questionNumber, questionType },
}: Props) => {
  const { t } = useTranslation()
  const PreparedComponent =
    QUESTION_REGISTRY[questionType].PreparedComponent ?? PreparedAnswers

  return (
    <section className="anim-show relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center">
      <h2 className="anim-show mb-20 text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
        {t("game:questionPrefix")}
        {questionNumber}
      </h2>
      <PreparedComponent totalAnswers={totalAnswers} />
    </section>
  )
}

export default Prepared
