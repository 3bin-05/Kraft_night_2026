"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/lib/socket";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const { status } = useSocket();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOffline(false);
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 4000);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const isSocketReconnecting = status === "connecting" || status === "error";

  if (isOffline) {
    return (
      <div className="bg-[#141414] text-white px-4 py-2.5 text-center text-xs font-mono font-medium flex items-center justify-center gap-2 border-b border-red-500/50 shadow-md animate-fade-in z-50 sticky top-0">
        <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
        <span>NETWORK OFFLINE: Internet connection lost. Real-time emergency telemetry paused.</span>
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div className="bg-green-700 text-white px-4 py-2 text-center text-xs font-mono font-medium flex items-center justify-center gap-2 border-b border-green-800 shadow-md animate-fade-in z-50 sticky top-0">
        <CheckCircle2 className="w-4 h-4 text-white" />
        <span>CONNECTION RESTORED: Re-synchronized with emergency response network.</span>
      </div>
    );
  }

  if (isSocketReconnecting && !isOffline) {
    return (
      <div className="bg-[#F0F0F0] text-[#141414] px-4 py-1.5 text-center text-[11px] font-mono border-b border-[#E0E0E0] flex items-center justify-center gap-2 z-40">
        <RefreshCw className="w-3 h-3 text-[#707070] animate-spin" />
        <span className="text-[#707070]">
          RECONNECTING: Stream telemetry reconnecting in background...
        </span>
      </div>
    );
  }

  return null;
}
