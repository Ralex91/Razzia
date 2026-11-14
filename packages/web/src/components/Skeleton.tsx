import clsx from "clsx"
import { twMerge } from "tailwind-merge"

interface Props {
  className?: string
}

const Skeleton = ({ className }: Props) => (
  <div
    className={twMerge(clsx("animate-pulse rounded-md bg-muted", className))}
    aria-hidden
  />
)

export const SkeletonRows = ({
  count = 5,
  className,
}: Props & { count?: number }) =>
  Array.from({ length: count }, (_, index) => (
    <Skeleton key={index} className={className} />
  ))

export default Skeleton
