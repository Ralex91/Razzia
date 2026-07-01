import type { PropsWithChildren } from "react"

type Props = PropsWithChildren<{
  title: string
}>

const ConfigSection = ({ title, children }: Props) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-sm font-bold tracking-wide text-gray-500 uppercase">
      {title}
    </h3>
    {children}
  </div>
)

export default ConfigSection
