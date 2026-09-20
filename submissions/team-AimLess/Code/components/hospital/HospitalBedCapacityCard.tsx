import React from "react";
import { Hospital } from "@/types/hospital";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Bed, Plus, Minus, Building2, Phone, MapPin } from "lucide-react";

interface HospitalBedCapacityCardProps {
  hospital: Hospital;
  onUpdateBeds: (newBedsCount: number) => void;
  disabled?: boolean;
}

export function HospitalBedCapacityCard({
  hospital,
  onUpdateBeds,
  disabled = false,
}: HospitalBedCapacityCardProps) {
  return (
    <Card variant="white" className="p-6 border border-[#E0E0E0]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold text-xs shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-[#141414]">{hospital.name}</h3>
          <Badge variant="dark" className="text-[10px] px-2 py-0.5 mt-0.5">
            {hospital.code}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 text-xs text-[#707070] border-t border-[#E0E0E0] pt-4 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#141414]" />
          <span>{hospital.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-[#141414]" />
          <span>{hospital.phone}</span>
        </div>
      </div>

      {/* Bed Capacity Counter */}
      <div className="p-4 rounded-[16px] bg-[#F3F3F3] border border-[#E0E0E0] flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#707070] flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5 text-[#141414]" /> Available ICU / Trauma Bays
          </div>
          <div className="text-2xl font-mono font-bold text-[#141414] mt-0.5">
            {hospital.availableBeds} <span className="text-xs font-normal text-[#707070]">Beds Ready</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || hospital.availableBeds <= 0}
            onClick={() => onUpdateBeds(Math.max(0, hospital.availableBeds - 1))}
            className="w-9 h-9 rounded-full bg-white border border-[#E0E0E0] text-[#141414] hover:bg-[#EAEAEA] active:scale-95 flex items-center justify-center disabled:opacity-40 transition-transform"
            aria-label="Decrease beds"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUpdateBeds(hospital.availableBeds + 1)}
            className="w-9 h-9 rounded-full bg-white border border-[#E0E0E0] text-[#141414] hover:bg-[#EAEAEA] active:scale-95 flex items-center justify-center disabled:opacity-40 transition-transform"
            aria-label="Increase beds"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
