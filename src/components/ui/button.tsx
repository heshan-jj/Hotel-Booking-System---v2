import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium tracking-tight transition-all duration-150 select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-45 disabled:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-ios-sm hover:bg-primary/90 active:bg-primary/95 font-semibold",
        destructive:
          "bg-rose-500 text-white shadow-[0_1px_2px_rgba(244,63,94,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.2)] hover:bg-rose-600 active:bg-rose-700 border border-rose-600/30 font-semibold",
        outline:
          "border border-black/[0.12] dark:border-white/[0.12] bg-white/90 dark:bg-zinc-900/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-foreground",
        secondary:
          "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-200/70 dark:hover:bg-zinc-700/70 border border-black/[0.04] dark:border-white/[0.05]",
        ghost:
          "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-sm font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
