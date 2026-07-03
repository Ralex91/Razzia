import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@razzia/web/components/Select"
import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

const LANGUAGES = [
  { code: "de", label: "common:language.de" },
  { code: "en", label: "common:language.en" },
  { code: "es", label: "common:language.es" },
  { code: "fr", label: "common:language.fr" },
  { code: "it", label: "common:language.it" },
  { code: "ja", label: "common:language.ja" },
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
        hideChevron
        className="w-auto gap-1.5 border px-2 py-1.5 text-gray-600"
      >
        <Globe className="size-4 text-gray-500" />
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
