import type { PropsWithChildren } from "react"

type Props = PropsWithChildren<{
  title: string
}>

const ConfigSection = ({ title, children }: Props) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-muted-foreground text-sm font-bold tracking-wide uppercase">
      {title}
    </h3>
    {children}
  </div>
)

export default ConfigSection
