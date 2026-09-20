"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // Landing page, auth pages, and dedicated dashboards have their own footers/layouts
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/citizen") ||
    pathname.startsWith("/hospital")
  ) {
    return null;
  }

  return (
    <footer className="w-full bg-[#FAFAFA] border-t border-neutral-200 py-10 px-6 sm:px-8 lg:px-12 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-[0.2em] text-[#141414] uppercase">
              GΛBRIEL
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs text-neutral-500 font-medium">
              Autonomous Emergency Response Platform
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Rapid road accident incident reporting and multi-agency coordination.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs font-semibold text-neutral-600">
          <Link href="/emergency-report" className="hover:text-black transition-colors">
            Emergency SOS
          </Link>
          <Link href="/login" className="hover:text-black transition-colors">
            Staff Portal
          </Link>
          <Link href="/register" className="hover:text-black transition-colors">
            Create Account
          </Link>
        </div>
      </div>
    </footer>
  );
}
