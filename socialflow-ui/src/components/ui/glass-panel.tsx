import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const glassPanelVariants = cva(
  "rounded-2xl border transition-all duration-200",
  {
    variants: {
      blur: {
        sm: "backdrop-blur-sm",
        md: "backdrop-blur-md",
        lg: "backdrop-blur-lg",
        xl: "backdrop-blur-xl",
      },
      variant: {
        default: "bg-white/75 border-white/20 shadow-glass dark:bg-slate-900/75 dark:border-white/10",
        subtle: "bg-white/50 border-white/10 dark:bg-slate-900/50",
        solid: "bg-white/90 border-white/30 shadow-lg dark:bg-slate-900/90 dark:border-white/15",
      },
    },
    defaultVariants: {
      blur: "xl",
      variant: "default",
    },
  }
)

export interface GlassPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassPanelVariants> {}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, blur, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(glassPanelVariants({ blur, variant }), className)}
      {...props}
    />
  )
)
GlassPanel.displayName = "GlassPanel"

export { GlassPanel, glassPanelVariants }
