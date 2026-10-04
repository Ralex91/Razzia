import type { GameSettings } from "@razzia/common/types/game"
import Switch from "@razzia/web/components/Switch"
import NumberField from "@razzia/web/components/forms/NumberField"
import SettingRow from "@razzia/web/features/game/components/GameSettingsModal/SettingRow"
import { Controller, useFormContext, useWatch } from "react-hook-form"

const AutoAdvance = () => {
  const { control } = useFormContext<GameSettings>()
  const enable = useWatch({ control, name: "autoAdvance.enable" })

  return (
    <>
      <Controller
        control={control}
        name="autoAdvance.enable"
        render={({ field }) => (
          <SettingRow
            label="game:settings.autoAdvance.label"
            hint="game:settings.autoAdvance.hint"
          >
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </SettingRow>
        )}
      />

      {enable && (
        <div className="mt-4 flex items-start gap-4">
          <NumberField
            name="autoAdvance.responsesDelay"
            label="game:settings.autoAdvance.responsesDelay"
            className="flex-1"
          />
          <NumberField
            name="autoAdvance.leaderboardDelay"
            label="game:settings.autoAdvance.leaderboardDelay"
            className="flex-1"
          />
        </div>
      )}
    </>
  )
}

export default AutoAdvance
