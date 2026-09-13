import * as React from "react"
import { X } from "lucide-react"
import { useFocusTrap } from "@/hooks/useFocusTrap"
import { Button } from "@/components/ui/button"

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  maxWidthClass?: string
  id?: string
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidthClass = "max-w-2xl",
  id = "modal-dialog",
}: DialogProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)
  const titleId = `${id}-title`

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 overflow-y-auto">
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={title ? titleId : undefined}
        className={`relative z-10 w-full ${maxWidthClass} rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 shadow-2xl text-slate-900 dark:text-zinc-100 outline-none my-8 max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        {(title || Boolean(onClose)) && (
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/[0.08] p-5 sm:p-6 pb-4">
            <div>
              {title && (
                <h2 id={titleId} className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {description}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close dialog"
              className="h-11 w-11 sm:h-8 sm:w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
