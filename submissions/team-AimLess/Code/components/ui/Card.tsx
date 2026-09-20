"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "white" | "dark" | "outline";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "surface", children, ...props }, ref) => {
    const variantStyles = {
      surface: "bg-[#F3F3F3] border border-[#E0E0E0]/60 text-[#141414]",
      white: "bg-[#FFFFFF] border border-[#E0E0E0] shadow-sm text-[#141414]",
      dark: "bg-[#141414] text-[#FFFFFF] border border-[#262626]",
      outline: "bg-transparent border border-[#E0E0E0] text-[#141414]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[24px] p-6 sm:p-8 transition-all duration-200",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
