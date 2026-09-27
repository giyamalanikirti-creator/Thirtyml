import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-night-raised border border-line text-moon-dim",
        sodium: "bg-sodium/15 text-sodium",
        dusk: "bg-dusk/15 text-dusk",
        drop: "bg-drop/15 text-drop",
        rise: "bg-rise/15 text-rise",
        danger: "bg-danger/15 text-danger",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
