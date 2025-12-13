import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary border border-primary/20",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive/10 text-destructive border border-destructive/20",
        outline:
          "border text-foreground bg-transparent",
        // Status variants - vibrant and accessible
        pending:
          "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700",
        needsAi:
          "bg-violet-100 text-violet-700 border border-violet-300 animate-pulse-soft dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-700",
        needsReview:
          "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700",
        approved:
          "bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700",
        scheduled:
          "bg-sky-100 text-sky-700 border border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700",
        failed:
          "bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700",
        blocked:
          "bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700",
        // Platform badges
        instagram:
          "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-pink-600 border border-pink-200 dark:text-pink-400 dark:border-pink-800",
        tiktok:
          "bg-black/5 text-black border border-black/20 dark:bg-white/10 dark:text-white dark:border-white/20",
        // Success variant (for actions)
        success:
          "bg-emerald-500 text-white border-transparent",
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
