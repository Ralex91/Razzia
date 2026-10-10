import type { GameSettings } from "@razzia/common/types/game"
import Switch from "@razzia/web/components/Switch"
import SettingRow from "@razzia/web/features/game/components/GameSettingsModal/SettingRow"
import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

const AnswersOnly = () => {
  const { control } = useFormContext<GameSettings>()
  const { t } = useTranslation()

  return (
    <Controller
      control={control}
      name="answersOnly"
      render={({ field }) => (
        <SettingRow
          label="game:settings.answersOnly.label"
          hint="game:settings.answersOnly.hint"
        >
          <Switch
            aria-label={t("game:settings.answersOnly.label")}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </SettingRow>
      )}
    />
  )
}

export default AnswersOnly
