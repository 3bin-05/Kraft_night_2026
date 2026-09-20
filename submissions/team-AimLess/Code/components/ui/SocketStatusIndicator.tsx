"use client";

import React from "react";
import { useSocket } from "@/lib/socket";
import { Radio } from "lucide-react";

export function SocketStatusIndicator() {
  const { status } = useSocket();

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-[#F0F0F0] text-[#141414] border border-[#E0E0E0] select-none">
      <span className="relative flex h-2 w-2">
        {status === "connected" ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
          </>
        ) : status === "connecting" ? (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse" />
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400" />
        )}
      </span>
      <span className="text-[11px] font-semibold text-[#707070]">
        {status === "connected"
          ? "LIVE TELEMETRY"
          : status === "connecting"
          ? "CONNECTING..."
          : "SYNCING..."}
      </span>
    </div>
  );
}
