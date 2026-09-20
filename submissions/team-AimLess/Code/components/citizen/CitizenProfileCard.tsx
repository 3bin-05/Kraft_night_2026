import React from "react";
import { User } from "@/types/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { User as UserIcon, Mail, Phone, ShieldCheck, HeartPulse } from "lucide-react";

interface CitizenProfileCardProps {
  user: User;
}

export function CitizenProfileCard({ user }: CitizenProfileCardProps) {
  return (
    <Card variant="surface" className="p-6 border border-[#E0E0E0]">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold text-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-base font-bold text-[#141414]">{user.name}</h3>
          <Badge variant="dark" className="text-[10px] px-2 py-0.5 mt-0.5">
            Verified Citizen
          </Badge>
        </div>
      </div>

      <div className="space-y-3 text-xs text-[#707070] border-t border-[#E0E0E0] pt-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-[#141414]">
            <Mail className="w-3.5 h-3.5 text-[#707070]" /> Email:
          </span>
          <span className="text-[#141414]">{user.email}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-[#141414]">
            <Phone className="w-3.5 h-3.5 text-[#707070]" /> Phone:
          </span>
          <span className="text-[#141414]">{user.phone || "Not recorded"}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-[#141414]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#707070]" /> Auth Status:
          </span>
          <span className="text-green-700 font-semibold">PostgreSQL Session</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-[#141414]">
            <HeartPulse className="w-3.5 h-3.5 text-[#707070]" /> Rapid Response:
          </span>
          <span className="text-[#141414] font-medium">Ready</span>
        </div>
      </div>
    </Card>
  );
}
