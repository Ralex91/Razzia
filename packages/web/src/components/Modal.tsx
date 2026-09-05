import { X } from "lucide-react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"

interface Props {
  title: string
  onClose: () => void
  className?: string
  children: ReactNode
}

const Modal = ({ title, onClose, className = "", children }: Props) => {
  const { t } = useTranslation()

  return createPortal(
    <div
      className="fixed inset-0 z-[9999999999] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        className={`bg-background flex flex-col gap-4 rounded-xl p-6 shadow-xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label={t("common:close")}>
            <X className="text-foreground size-5" />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
