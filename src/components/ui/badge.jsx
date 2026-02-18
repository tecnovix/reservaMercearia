import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-orange-custom-100 text-orange-custom-800 border border-orange-custom-200 rounded-full",
        secondary:
          "bg-gray-100 text-gray-800 border border-gray-200 rounded-full",
        destructive:
          "bg-red-100 text-red-800 border border-red-200 rounded-md",
        outline: "border border-gray-300 text-gray-700 rounded-full",
        success: "bg-green-100 text-green-800 border border-green-200 rounded-full",
        warning: "bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }