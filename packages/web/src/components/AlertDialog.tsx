import type { ReactNode } from "react"
import { AlertDialog as RadixAlertDialog } from "radix-ui"
import { useTranslation } from "react-i18next"
import Button from "@razzia/web/components/Button"

interface Props {
  trigger: ReactNode
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
}

const AlertDialog = ({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
}: Props) => {
  const { t } = useTranslation()

  return (
    <RadixAlertDialog.Root>
      <RadixAlertDialog.Trigger asChild>{trigger}</RadixAlertDialog.Trigger>

      <RadixAlertDialog.Portal>
        <RadixAlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-fade" />

        <RadixAlertDialog.Content
          onClick={(e) => e.stopPropagation()}
          className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background p-6 shadow-xl"
        >
          <RadixAlertDialog.Title className="text-lg font-semibold text-foreground">
            {title}
          </RadixAlertDialog.Title>

          <RadixAlertDialog.Description className="mt-2 text-muted-foreground">
            {description}
          </RadixAlertDialog.Description>

          <div className="mt-6 flex justify-end gap-2">
            <RadixAlertDialog.Cancel asChild>
              <Button className="bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
                {t("common:cancel")}
              </Button>
            </RadixAlertDialog.Cancel>

            <RadixAlertDialog.Action asChild>
              <Button
                className="bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-95 active:brightness-90"
                onClick={onConfirm}
              >
                {confirmLabel ?? t("common:confirm")}
              </Button>
            </RadixAlertDialog.Action>
          </div>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  )
}

export default AlertDialog
