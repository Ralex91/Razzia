import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@razzia/web/components/Select"

const LANGUAGES = [
  { code: "de", label: "common:language.de" },
  { code: "en", label: "common:language.en" },
  { code: "es", label: "common:language.es" },
  { code: "fr", label: "common:language.fr" },
  { code: "it", label: "common:language.it" },
  { code: "ja", label: "common:language.ja" },
  { code: "tr", label: "common:language.tr" },
  { code: "pl", label: "common:language.pl" },
  { code: "vi", label: "common:language.vi" },
]

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation()
  const normalizedLanguage = i18n.language.slice(0, 2)

  return (
    <Select
      value={normalizedLanguage}
      onValueChange={(lang) => i18n.changeLanguage(lang)}
    >
      <SelectTrigger
        aria-label={t("common:changeLanguage")}
        hideChevron
        className="w-auto gap-1.5 border px-2 py-1.5 text-accent-foreground"
      >
        <Globe className="size-4 text-muted-foreground" />
        <SelectValue>{normalizedLanguage.toUpperCase()}</SelectValue>
      </SelectTrigger>
      <SelectContent className="w-auto min-w-32">
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {t(l.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default LanguageSwitcher
