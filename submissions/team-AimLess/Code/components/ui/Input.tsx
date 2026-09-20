"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = "text", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[#141414] tracking-tight uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={cn(
              "w-full px-4 py-3.5 bg-[#F0F0F0] text-[#141414] placeholder-[#ADADAD] text-sm rounded-[16px] border border-transparent transition-all duration-200 outline-none focus:bg-[#FFFFFF] focus:border-[#141414] focus:ring-1 focus:ring-[#141414] disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-red-600 mt-0.5 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#707070] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
