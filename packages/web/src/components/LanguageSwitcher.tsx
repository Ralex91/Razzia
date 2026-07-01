import * as Select from "@radix-ui/react-select"
import { Check, Globe } from "lucide-react"
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
    <Select.Root
      value={normalizedLanguage}
      onValueChange={(lang) => i18n.changeLanguage(lang)}
    >
      <Select.Trigger className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-semibold text-gray-600 hover:border-gray-300 focus:outline-none">
        <Globe className="size-4 text-gray-500" />
        <Select.Value>{normalizedLanguage.toUpperCase()}</Select.Value>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-50 min-w-32 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md"
        >
          <Select.Viewport className="p-1">
            {LANGUAGES.map((l) => (
              <Select.Item
                key={l.code}
                value={l.code}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-1.5 text-sm text-gray-700 outline-none hover:bg-gray-100 focus:bg-gray-100 data-[state=checked]:font-semibold"
              >
                <Select.ItemText>{t(l.label)}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="size-3.5 text-gray-500" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

export default LanguageSwitcher
