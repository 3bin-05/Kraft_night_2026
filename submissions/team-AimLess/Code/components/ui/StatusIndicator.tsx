import React from "react";
import { cn } from "@/lib/utils";

export interface StatusIndicatorProps {
  status?: "online" | "offline" | "alert" | "active";
  label?: string;
  className?: string;
}

export function StatusIndicator({
  status = "online",
  label,
  className,
}: StatusIndicatorProps) {
  const dotStyles = {
    online: "bg-[#141414]",
    offline: "bg-[#ADADAD]",
    alert: "bg-[#141414] animate-ping",
    active: "bg-[#141414]",
  };

  return (
    <div className={cn("inline-flex items-center gap-2 text-xs font-medium text-[#707070]", className)}>
      <span className="relative flex h-2 w-2">
        {status === "alert" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#141414] opacity-75"></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", dotStyles[status])}></span>
      </span>
      {label && <span>{label}</span>}
    </div>
  );
}
