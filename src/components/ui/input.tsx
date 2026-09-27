import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-sm border border-line bg-night px-3 text-sm text-moon placeholder:text-moon-dim disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
