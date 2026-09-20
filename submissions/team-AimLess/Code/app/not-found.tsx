import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Compass, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card variant="surface" className="max-w-md w-full p-8 text-center border border-[#E0E0E0] rounded-[24px]">
        <div className="w-12 h-12 rounded-full bg-[#141414] text-white flex items-center justify-center mx-auto mb-4">
          <Compass className="w-6 h-6" />
        </div>
        <span className="text-[11px] font-mono font-bold tracking-wider text-[#707070] uppercase">
          404 — Routing Not Found
        </span>
        <h2 className="text-xl font-bold text-[#141414] mt-1 mb-2">
          Page Not Located on Network
        </h2>
        <p className="text-xs text-[#707070] mb-6 leading-relaxed">
          The requested emergency coordinate or resource does not exist on the current network routing table.
        </p>

        <Link href="/">
          <Button variant="primary" size="sm">
            <Home className="w-3.5 h-3.5 mr-1.5" /> Return to Safety / Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}
