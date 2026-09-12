import type { GameSettings } from "@razzia/common/types/game"
import Switch from "@razzia/web/components/Switch"
import Tooltip from "@razzia/web/components/Tooltip"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import { updateGameSettings } from "@razzia/web/features/manager/queries"
import { ApiError } from "@razzia/web/lib/api"
import { useMutation } from "@tanstack/react-query"
import { Settings, X } from "lucide-react"
import { Dialog } from "radix-ui"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

const GameSettingsModal = () => {
  const { gameId, settings, updateManager } = useManagerStore()
  const { t } = useTranslation()

  const { mutate: save } = useMutation({
    mutationFn: updateGameSettings,
    onSuccess: ({ settings: saved }) => updateManager({ settings: saved }),
    onError: (error, { json }) => {
      updateManager({
        settings: { ...settings, ...invert(json) },
      })
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:route.description"),
      )
    },
  })

  const handleToggle = (key: keyof GameSettings) => (checked: boolean) => {
    if (!gameId) {
      return
    }

    updateManager({ settings: { ...settings, [key]: checked } })
    save({ gameId, json: { [key]: checked } })
  }

  return (
    <Dialog.Root>
      <Tooltip content={t("game:settings.title")}>
        <Dialog.Trigger className="flex items-center justify-center rounded-lg bg-black/40 px-2.5 text-white drop-shadow-md hover:bg-black/60">
          <Settings className="size-5" />
        </Dialog.Trigger>
      </Tooltip>

      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade fixed inset-0 z-50 bg-black/40" />

        <Dialog.Content
          aria-describedby={undefined}
          className="bg-background data-[state=open]:animate-fade fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-xl"
        >
          <Dialog.Close className="hover:bg-muted text-muted-foreground hover:text-foreground absolute top-5 right-5 rounded-md p-1">
            <X className="size-5" />
          </Dialog.Close>

          <Dialog.Title className="text-foreground pr-8 text-lg font-semibold">
            {t("game:settings.title")}
          </Dialog.Title>

          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-foreground font-medium">
                {t("game:settings.generatedUsernames.label")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t("game:settings.generatedUsernames.hint")}
              </p>
            </div>

            <Switch
              className="mt-1 shrink-0"
              checked={settings.generatedUsernames}
              onCheckedChange={handleToggle("generatedUsernames")}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const invert = (settings: Partial<GameSettings>): Partial<GameSettings> =>
  Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [key, !value]),
  )

export default GameSettingsModal
