"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Telemetry Transmission Error",
  message = "An error occurred while communicating with the emergency response network.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <Card
      variant="surface"
      className={`p-8 text-center border border-red-200 rounded-[24px] ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#141414] mb-1">{title}</h3>
      <p className="text-xs text-[#707070] max-w-md mx-auto mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Connection
        </Button>
      )}
    </Card>
  );
}
