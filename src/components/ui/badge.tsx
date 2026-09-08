import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 select-none",
  {
    variants: {
      variant: {
        default:
          "border border-[#0071e3]/25 bg-[#0071e3]/10 text-[#0071e3] dark:text-[#3898ec]",
        secondary:
          "border border-black/[0.06] dark:border-white/[0.08] bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300",
        success:
          "border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        warning:
          "border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        destructive:
          "border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400",
        outline:
          "border border-black/[0.12] dark:border-white/[0.14] text-foreground bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
