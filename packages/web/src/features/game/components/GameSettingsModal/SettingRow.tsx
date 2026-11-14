import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  label: string
  hint?: string
  children: ReactNode
}

const SettingRow = ({ label, hint, children }: Props) => {
  const { t } = useTranslation()

  return (
    <div className="mt-6 flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-foreground">{t(label)}</p>
        {hint && <p className="text-sm text-muted-foreground">{t(hint)}</p>}
      </div>

      <div className="mt-1 shrink-0">{children}</div>
    </div>
  )
}

export default SettingRow
