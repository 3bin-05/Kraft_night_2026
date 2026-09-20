import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import {
  Zap,
  ArrowRight,
  Shield,
  Users,
  Building2,
  Truck,
  PhoneCall,
} from "lucide-react";

export const metadata: Metadata = {
  title: "GABRIEL — Autonomous Emergency Response Network",
  description:
    "Coordinating every second that matters. Connecting citizens, ambulances, and hospitals in real time.",
};

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-[#FFFFFF] text-[#141414] overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. FULL-BLEED HERO SECTION (hero.webp fills entire hero)
      ───────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden min-h-[640px] sm:min-h-[720px] lg:min-h-[820px] flex items-center">
        {/* Full-Bleed Background Image */}
        <Image
          src="/images/hero.webp"
          alt="GABRIEL Emergency Response"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center select-none pointer-events-none"
        />

        {/* Dark gradient overlay — left-heavy so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30 pointer-events-none" />
        {/* Bottom fade for smooth section transition */}
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#FFFFFF] to-transparent pointer-events-none z-10" />

        {/* Right Side Vertical Mission Stamp */}
        <div className="absolute top-28 sm:top-32 right-8 xl:right-14 z-20 hidden sm:flex items-start gap-2.5 text-white/90">
          <div className="w-[1.5px] h-9 bg-white/60" />
          <div className="text-[9px] uppercase font-bold tracking-[0.24em] leading-[1.35] text-white/70">
            A<br />
            Safer<br />
            Tomorrow.<br />
            Together.
          </div>
        </div>

        {/* Hero Content */}
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-28 sm:pt-36 lg:pt-32 pb-24 lg:pb-28 relative z-20">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Tagline */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-[1.5px] bg-white/60 rounded-full" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.32em] text-white/70">
                People &nbsp;Faster &nbsp;Safer
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[60px] font-black text-white tracking-[-0.035em] leading-[1.06] mb-6">
              In an emergency,<br />
              every second counts.
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-white/70 font-normal leading-relaxed max-w-lg mb-9">
              Gabriel connects people, ambulances and hospitals for a faster, safer tomorrow.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-5 sm:gap-6 mb-12">
              {/* Emergency SOS Button */}
              <div className="flex flex-col items-center">
                <Link
                  href="/emergency-report"
                  className="px-8 py-3.5 rounded-full bg-white hover:bg-neutral-100 active:scale-[0.99] text-[#111111] text-sm font-semibold flex items-center gap-2.5 shadow-lg transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-[#111111] text-[#111111] shrink-0" />
                  <span>Report Emergency</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>
                <span className="text-[11px] text-white/50 mt-2 font-medium">
                  No account required
                </span>
              </div>

              {/* Log In Button */}
              <div className="flex flex-col items-center">
                <Link
                  href="/login"
                  className="px-8 py-3.5 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 backdrop-blur-sm active:scale-[0.99] text-white text-sm font-semibold flex items-center gap-2.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>
                <span className="text-[11px] text-white/50 mt-2 font-medium">
                  Access your dashboard
                </span>
              </div>
            </div>

            {/* Value Pillars Row */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20 max-w-lg">
              {/* Pillar 1 */}
              <div className="flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-white/70 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white leading-tight">
                    Faster Response
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    Lives Saved
                  </div>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="flex items-start gap-2.5 pl-3 border-l border-white/20">
                <Users className="w-4 h-4 text-white/70 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white leading-tight">
                    Connected Network
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    Ambulances &amp; Hospitals
                  </div>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="flex items-start gap-2.5 pl-3 border-l border-white/20">
                <Shield className="w-4 h-4 text-white/70 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white leading-tight">
                    Stronger Communities
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    A Safer Tomorrow
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ABOUT GABRIEL SECTION (Linked with Navbar #about)
      ───────────────────────────────────────────────────────────── */}
      <section id="about" className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24">
        {/* Section Tag & Headline */}
        <div className="max-w-3xl mb-14 sm:mb-18">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#707070]">
              About GABRIEL &bull; The Autonomous Lifeline
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#111111] tracking-tight leading-[1.12] mb-5">
            Bridging the Golden Hour with Autonomous Precision.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 font-normal leading-relaxed">
            GABRIEL is a next-generation emergency response ecosystem engineered to eliminate dispatch delays, optimize road transit corridors, and synchronize emergency rooms before the ambulance even arrives.
          </p>
        </div>

        {/* 4 Feature Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {/* Pillar 1: Intelligent Assignment */}
          <div className="p-7 rounded-[26px] bg-[#F7F7F8] border border-neutral-200/80 hover:border-black/20 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#141414] text-white flex items-center justify-center mb-5 shadow-sm">
                <Zap className="w-6 h-6 fill-white" />
              </div>
              <h3 className="text-lg font-bold text-[#141414] tracking-tight mb-2">
                Triage-Aware Dispatch
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Matches reported patient injury severity against certified ambulance capabilities (Level A–D / ALS / Mobile ICU) in under 3 seconds.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-200/60 text-[11px] font-mono font-semibold text-neutral-500">
              01 &bull; CAPABILITY ENGINE
            </div>
          </div>

          {/* Pillar 2: Tactical Routing */}
          <div className="p-7 rounded-[26px] bg-[#F7F7F8] border border-neutral-200/80 hover:border-black/20 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#141414] text-white flex items-center justify-center mb-5 shadow-sm">
                <Truck className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg font-bold text-[#141414] tracking-tight mb-2">
                Tactical Road Routing
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Powered by OSRM road-network algorithms and Google Maps matrix grids with dynamic reroute alerts for faster transit paths.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-200/60 text-[11px] font-mono font-semibold text-neutral-500">
              02 &bull; CORRIDOR OPTIMIZER
            </div>
          </div>

          {/* Pillar 3: Hospital Synchronization */}
          <div className="p-7 rounded-[26px] bg-[#F7F7F8] border border-neutral-200/80 hover:border-black/20 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#141414] text-white flex items-center justify-center mb-5 shadow-sm">
                <Building2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg font-bold text-[#141414] tracking-tight mb-2">
                Hospital Readiness Link
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Evaluates hospital trauma capabilities and active ICU bed capacity in real-time, delivering live ambulance ETA telemetry to emergency departments.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-200/60 text-[11px] font-mono font-semibold text-neutral-500">
              03 &bull; ER READINESS SYNC
            </div>
          </div>

          {/* Pillar 4: Real-time Telemetry */}
          <div className="p-7 rounded-[26px] bg-[#F7F7F8] border border-neutral-200/80 hover:border-black/20 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#141414] text-white flex items-center justify-center mb-5 shadow-sm">
                <Shield className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg font-bold text-[#141414] tracking-tight mb-2">
                Unified Lifeline Network
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Seamless real-time Socket.IO synchronization connecting citizens, paramedic crews, and trauma physicians with zero communication friction.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-200/60 text-[11px] font-mono font-semibold text-neutral-500">
              04 &bull; LIVE TELEMETRY
            </div>
          </div>
        </div>

        {/* Highlight Banner / Core Purpose */}
        <div className="p-8 sm:p-10 rounded-[28px] bg-[#141414] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
          <div className="max-w-2xl">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.24em] text-neutral-400">
              Our Mission Promise
            </span>
            <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1.5 mb-2">
              Transforming fragmented emergency logistics into a cohesive, second-by-second coordinated response.
            </h4>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Every accident reported to GABRIEL triggers an autonomous verification sequence that guides paramedic crews through the fastest road corridor directly to trauma centers verified to have open beds and the exact medical equipment required.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/emergency-report"
              className="px-6 py-3.5 rounded-full bg-white text-[#141414] hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider text-center transition-all shadow-md"
            >
              Report Emergency SOS
            </Link>
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-full border border-neutral-700 hover:border-neutral-500 text-white font-bold text-xs uppercase tracking-wider text-center transition-all"
            >
              Join the Network
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SIMPLE STEPS / HOW GABRIEL WORKS
      ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-14 lg:py-18">
        <div className="bg-[#F7F7F8] rounded-[28px] sm:rounded-[36px] p-8 sm:p-12 lg:p-14 border border-neutral-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Header Info */}
            <div className="lg:col-span-4">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.26em] text-neutral-400 mb-2">
                Simple Steps
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight leading-tight mb-3">
                How Gabriel<br className="hidden sm:inline" /> works
              </h2>
              <p className="text-sm sm:text-[15px] text-neutral-500 font-normal leading-relaxed">
                From the moment you report, Gabriel coordinates the right help and keeps everyone connected.
              </p>
            </div>

            {/* Right Steps Progression */}
            <div className="lg:col-span-8 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-2">
              {/* Step 1: Report */}
              <div className="flex flex-col items-center text-center max-w-[140px]">
                <div className="w-16 h-16 rounded-full bg-[#EAEAEA] flex items-center justify-center text-[#141414] mb-3 transition-transform hover:scale-105">
                  <PhoneCall className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div className="text-sm font-bold text-[#111111] mb-1">
                  1. Report
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Share your location and accident details.
                </p>
              </div>

              {/* Connector Arrow */}
              <div className="hidden sm:flex text-neutral-300 font-light text-xl">
                →
              </div>

              {/* Step 2: Dispatch */}
              <div className="flex flex-col items-center text-center max-w-[140px]">
                <div className="w-16 h-16 rounded-full bg-[#EAEAEA] flex items-center justify-center text-[#141414] mb-3 transition-transform hover:scale-105">
                  <Truck className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div className="text-sm font-bold text-[#111111] mb-1">
                  2. Dispatch
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Nearest ambulance is assigned.
                </p>
              </div>

              {/* Connector Arrow */}
              <div className="hidden sm:flex text-neutral-300 font-light text-xl">
                →
              </div>

              {/* Step 3: Notify */}
              <div className="flex flex-col items-center text-center max-w-[140px]">
                <div className="w-16 h-16 rounded-full bg-[#EAEAEA] flex items-center justify-center text-[#141414] mb-3 transition-transform hover:scale-105">
                  <Building2 className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div className="text-sm font-bold text-[#111111] mb-1">
                  3. Notify
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Hospital is alerted and prepared.
                </p>
              </div>

              {/* Connector Arrow */}
              <div className="hidden sm:flex text-neutral-300 font-light text-xl">
                →
              </div>

              {/* Step 4: Together */}
              <div className="flex flex-col items-center text-center max-w-[140px]">
                <div className="w-16 h-16 rounded-full bg-[#EAEAEA] flex items-center justify-center text-[#141414] mb-3 transition-transform hover:scale-105">
                  <Users className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div className="text-sm font-bold text-[#111111] mb-1">
                  4. Together
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Faster care. More lives saved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. DARK HERO BANNER (Shared Journey & Live Stats)
      ───────────────────────────────────────────────────────────── */}
      <section id="impact" className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-16">
        <div className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[#0A0A0A] text-white p-8 sm:p-12 lg:p-14 select-none">
          {/* Background Highway Cityscape Photograph */}
          <Image
            src="/images/gabriel-home-banner.jpg"
            alt="City Highway Network at Night"
            fill
            sizes="(max-width: 1280px) 100vw, 1200px"
            className="object-cover object-center opacity-40 mix-blend-luminosity brightness-75 contrast-125"
          />

          {/* Dark Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/85" />

          {/* Banner Content Container */}
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            {/* Left Quote & Brand */}
            <div className="max-w-md">
              <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-white tracking-tight leading-snug mb-6">
                “A safer tomorrow<br />
                is a shared journey.”
              </h3>
              <div className="flex items-center gap-1.5 text-white/90 font-black text-lg tracking-[0.34em] uppercase">
                <span>G</span>
                <span className="inline-block font-sans font-normal scale-y-110">Λ</span>
                <span>B</span>
                <span>R</span>
                <span>I</span>
                <span>E</span>
                <span>L</span>
              </div>
            </div>

            {/* Right Live Operational Highlights */}
            <div className="grid grid-cols-3 gap-6 sm:gap-10 border-t lg:border-t-0 lg:border-l border-white/20 pt-6 lg:pt-0 lg:pl-12 w-full lg:w-auto">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  24/7
                </div>
                <div className="text-xs text-neutral-400 mt-1 font-medium">
                  Response Network
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Real-time
                </div>
                <div className="text-xs text-neutral-400 mt-1 font-medium">
                  Coordination
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Stronger
                </div>
                <div className="text-xs text-neutral-400 mt-1 font-medium">
                  Communities
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. FOOTER SECTION
      ───────────────────────────────────────────────────────────── */}
      <footer id="contact" className="border-t border-neutral-100 bg-[#FAFAFA] py-10 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-black text-base tracking-[0.25em] text-[#141414] uppercase">
              GΛBRIEL
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs text-neutral-500 font-medium">
              Autonomous Emergency Response Platform
            </span>
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
    </div>
  );
}
