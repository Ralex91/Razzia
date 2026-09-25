import type { GameSettings } from "@razzia/common/types/game"
import Switch from "@razzia/web/components/Switch"
import SettingRow from "@razzia/web/features/game/components/GameSettingsModal/SettingRow"
import { Controller, useFormContext } from "react-hook-form"

const AnswersOnly = () => {
  const { control } = useFormContext<GameSettings>()

  return (
    <Controller
      control={control}
      name="answersOnly"
      render={({ field }) => (
        <SettingRow
          label="game:settings.answersOnly.label"
          hint="game:settings.answersOnly.hint"
        >
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        </SettingRow>
      )}
    />
  )
}

export default AnswersOnly
