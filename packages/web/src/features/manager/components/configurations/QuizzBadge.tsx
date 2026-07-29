import type { QuizzMeta } from "@razzia/common/types/game"
import { permOf } from "@razzia/web/features/auth/permissions"
import { Crown, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

/** Small pill showing whether a quiz is owned or shared, and at what level. */
const QuizzBadge = ({ quizz }: { quizz: QuizzMeta }) => {
  const { t } = useTranslation()
  const perm = permOf(quizz)

  if (perm === "owner") {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        <Crown className="size-3" />
        {t("manager:quizz.badge.owner")}
      </span>
    )
  }

  return (
    <span className="text-primary bg-primary/10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
      <Users className="size-3" />
      {quizz.ownerName
        ? t("manager:quizz.badge.sharedBy", {
            name: quizz.ownerName,
            perm: t(`manager:quizz.perm.${perm}`),
          })
        : t(`manager:quizz.perm.${perm}`)}
    </span>
  )
}

export default QuizzBadge
