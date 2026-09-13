import { useEffect, useRef } from "react"

/**
 * Traps keyboard focus inside a modal/dialog while it's open, returns focus to the
 * previously-focused element on close, and closes on Escape.
 *
 * Usage:
 *   const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)
 *   <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1}>...</div>
 */
export function useFocusTrap<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<T | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null

    const container = containerRef.current
    if (container) {
      const focusable = container.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      ;(focusable || container).focus()
    }

    function getFocusable(): HTMLElement[] {
      if (!container) return []
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null)
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== "Tab") return

      const focusable = getFocusable()
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown, true)
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  return containerRef
}
