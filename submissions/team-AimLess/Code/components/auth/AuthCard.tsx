import React from "react";
import { Card } from "@/components/ui/Card";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, badge, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 animate-fade-in">
      <Card variant="surface" className="p-8 sm:p-10 shadow-sm border border-[#E0E0E0]">
        <div className="flex flex-col gap-2 mb-8 text-center sm:text-left">
          {badge && (
            <div className="inline-flex items-center gap-2 self-center sm:self-start bg-[#141414] text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-1">
              {badge}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141414]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[#707070] font-normal leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </Card>
    </div>
  );
}
