"use client";

import React, { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Boundary Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card variant="surface" className="max-w-md w-full p-8 text-center border border-red-200 shadow-sm rounded-[24px]">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <span className="text-[11px] font-mono font-bold tracking-wider text-red-600 uppercase">
          System Exception Caught
        </span>
        <h2 className="text-lg font-bold text-[#141414] mt-1 mb-2">
          Emergency Interface Interrupted
        </h2>
        <p className="text-xs text-[#707070] mb-6 leading-relaxed">
          {error.message || "An unexpected application error occurred while processing emergency telemetry."}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" size="sm" onClick={() => reset()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reload Application
          </Button>
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="w-3.5 h-3.5 mr-1.5" /> Return Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
