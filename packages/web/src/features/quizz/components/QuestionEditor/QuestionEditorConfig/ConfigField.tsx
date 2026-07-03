import type { PropsWithChildren, ReactNode } from "react"

interface LabelProps {
  icon: ReactNode
  label: string
  unit?: string
  action?: ReactNode
}

const Label = ({ icon, label, unit, action }: LabelProps) => (
  <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
    {icon}
    {label}
    {unit && (
      <span className="text-muted-foreground text-xs font-normal">
        ({unit})
      </span>
    )}
    {action && <div className="ml-auto">{action}</div>}
  </div>
)

const Description = ({ children }: { children: string }) => (
  <p className="text-muted-foreground text-xs">{children}</p>
)

const ConfigField = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-1.5">{children}</div>
)

ConfigField.Label = Label
ConfigField.Description = Description

export default ConfigField
