import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "dark" | "outline" | "active";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#F0F0F0] text-[#141414] border border-[#E0E0E0]",
    dark: "bg-[#141414] text-[#FFFFFF]",
    outline: "border border-[#141414] text-[#141414] bg-transparent",
    active: "bg-[#141414] text-[#FFFFFF] font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
