import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-black/[0.09] dark:border-white/[0.1] bg-slate-50/80 dark:bg-zinc-900/60 px-3 py-1.5 text-sm tracking-tight text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150 placeholder:text-slate-400 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground hover:bg-slate-50 dark:hover:bg-zinc-900/90 focus:bg-white dark:focus:bg-zinc-950 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
