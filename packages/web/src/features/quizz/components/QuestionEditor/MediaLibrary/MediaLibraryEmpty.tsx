import { Upload } from "lucide-react"
import { useTranslation } from "react-i18next"

const MediaLibraryEmpty = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent p-6 text-center text-muted-foreground">
      <Upload className="size-10" />
      <p className="font-semibold text-foreground">
        {t("quizz:media.libraryEmpty")}
      </p>
      <p className="text-sm">{t("quizz:media.dropHint")}</p>
    </div>
  )
}

export default MediaLibraryEmpty
