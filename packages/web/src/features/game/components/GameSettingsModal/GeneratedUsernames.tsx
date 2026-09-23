import type { GameSettings } from "@razzia/common/types/game"
import Switch from "@razzia/web/components/Switch"
import SettingRow from "@razzia/web/features/game/components/GameSettingsModal/SettingRow"
import { Controller, useFormContext } from "react-hook-form"

const GeneratedUsernames = () => {
  const { control } = useFormContext<GameSettings>()

  return (
    <Controller
      control={control}
      name="generatedUsernames"
      render={({ field }) => (
        <SettingRow
          label="game:settings.generatedUsernames.label"
          hint="game:settings.generatedUsernames.hint"
        >
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        </SettingRow>
      )}
    />
  )
}

export default GeneratedUsernames
