import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import { ListChecks, Users } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"

interface Props {
  data: CommonStatusDataMap["SUMMARY"]
}

const Summary = ({
  data: { subject, totalPlayers, totalQuestions },
}: Props) => {
  const { t } = useTranslation()

  const stats = [
    {
      icon: Users,
      value: totalPlayers,
      label: t("game:summary.participants"),
    },
    {
      icon: ListChecks,
      value: totalQuestions,
      label: t("game:summary.questions"),
    },
  ]

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex flex-col items-center gap-5"
      >
        <div className="flex flex-col items-center gap-2">
          <p className="font-bold tracking-[0.25em] text-white uppercase drop-shadow-md">
            {t("game:summary.title")}
          </p>

          <h2 className="text-center text-3xl font-bold text-white drop-shadow-lg md:text-6xl">
            {subject}
          </h2>
        </div>
      </motion.div>

      <div className="grid w-full grid-cols-2 gap-4">
        {stats.map(({ icon: Icon, value, label }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
              delay: 0.15 + index * 0.1,
            }}
            className="bg-primary flex items-center gap-4 rounded-xl p-5 text-white"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-black/15">
              <Icon className="size-6" />
            </span>

            <div className="flex flex-col">
              <span className="text-4xl leading-none font-bold drop-shadow-md">
                {value}
              </span>
              <span className="text-sm font-semibold drop-shadow-md">
                {label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default Summary
