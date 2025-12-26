import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] hover:from-teal-600 hover:to-cyan-600 dark:from-teal-600 dark:to-cyan-700 dark:hover:from-teal-700 dark:hover:to-cyan-800",
        destructive:
          "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] hover:from-rose-600 hover:to-rose-700 dark:from-rose-600 dark:to-rose-700 dark:hover:from-rose-700 dark:hover:to-rose-800",
        outline:
          "border-2 border-teal-500/30 bg-transparent text-teal-600 hover:bg-teal-50 hover:border-teal-500/50 dark:text-teal-400 dark:border-teal-500/20 dark:hover:bg-teal-950/50 dark:hover:border-teal-500/40",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow",
        ghost:
          "hover:bg-teal-50 text-muted-foreground hover:text-teal-600 dark:hover:bg-teal-950/50 dark:hover:text-teal-400",
        link:
          "text-teal-600 underline-offset-4 hover:underline dark:text-teal-400",
        glass:
          "bg-white/80 backdrop-blur-md border border-white/20 shadow-glass text-foreground hover:bg-white/90 dark:bg-slate-900/80 dark:hover:bg-slate-900/90",
        success:
          "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] hover:from-emerald-600 hover:to-teal-600 dark:from-emerald-600 dark:to-teal-700 dark:hover:from-emerald-700 dark:hover:to-teal-800",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-12 w-12 rounded-xl",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
