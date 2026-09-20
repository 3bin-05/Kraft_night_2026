"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-full";

    const variantStyles = {
      primary:
        "bg-[#141414] text-[#ffffff] hover:bg-[#262626] active:scale-[0.98] shadow-sm",
      secondary:
        "bg-[#F0F0F0] text-[#141414] hover:bg-[#E5E5E5] active:scale-[0.98]",
      outline:
        "border border-[#E0E0E0] bg-transparent text-[#141414] hover:bg-[#F3F3F3] active:scale-[0.98]",
      ghost:
        "bg-transparent text-[#141414] hover:bg-[#F0F0F0] active:scale-[0.98]",
      danger:
        "bg-[#141414] text-[#ffffff] hover:bg-[#000000] active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "text-xs px-4 py-2 h-9",
      md: "text-sm px-6 py-3 h-12",
      lg: "text-base px-8 py-4 h-14 font-semibold tracking-wide",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Processing...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
