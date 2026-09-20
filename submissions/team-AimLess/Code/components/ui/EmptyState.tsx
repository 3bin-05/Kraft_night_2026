"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <Card
      variant="surface"
      className={`p-10 text-center border border-dashed border-[#E0E0E0] rounded-[24px] ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-white border border-[#E0E0E0] text-[#707070] flex items-center justify-center mx-auto mb-4">
        {icon || <Inbox className="w-5 h-5 text-[#707070]" />}
      </div>
      <h3 className="text-base font-bold text-[#141414] mb-1">{title}</h3>
      <p className="text-xs text-[#707070] max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
