"use client";

import React from "react";

interface LoadingStateProps {
  title?: string;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({
  title = "Loading Telemetry",
  message = "Synchronizing with the AIMLESS emergency response network...",
  fullScreen = false,
  className = "",
}: LoadingStateProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="relative mb-4 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#E0E0E0] border-t-[#141414] animate-spin" />
        <div className="w-3 h-3 rounded-full bg-[#141414] absolute" />
      </div>
      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#141414] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#707070] max-w-sm">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
