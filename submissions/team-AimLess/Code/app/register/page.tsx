import { RegisterForm } from "@/components/auth/RegisterForm";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Account — GABRIEL",
  description: "Register for the Gabriel Emergency Response Network.",
};

export default function RegisterPage() {
  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-[#FFFFFF]">
      {/* Left Column: Fixed B&W Cinematic Hero (50% desktop width, sticky, never scrolls) */}
      <div className="relative hidden lg:flex lg:w-1/2 h-full overflow-hidden bg-[#0A0A0A] select-none shrink-0">
        {/* Full bleed photograph */}
        <Image
          src="/images/gabriel-ambulance-hero.jpg"
          alt="GABRIEL Emergency Ambulance in Transit"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center brightness-[0.88] contrast-[1.12]"
        />

        {/* Noir Vignette & Legibility Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />

        {/* Seamless Blend Transition: Short narrow fade into white form panel */}
        <div className="absolute inset-y-0 right-0 w-20 xl:w-28 bg-gradient-to-r from-transparent via-white/40 to-[#FFFFFF] pointer-events-none z-10" />

        {/* Left Side Content Container */}
        <div className="relative z-10 w-full h-full p-10 xl:p-14 flex flex-col justify-between">
          {/* Top Row: Brand & Mission */}
          <div className="flex items-start justify-between w-full">
            <Link href="/" className="group cursor-pointer hover:opacity-85 transition-opacity">
              <div className="flex items-center gap-1.5 text-white font-black text-[22px] tracking-[0.36em] uppercase">
                <span>G</span>
                <span className="inline-block font-sans font-normal scale-y-110">Λ</span>
                <span>B</span>
                <span>R</span>
                <span>I</span>
                <span>E</span>
                <span>L</span>
              </div>
              <p className="text-[9px] uppercase font-semibold tracking-[0.38em] text-neutral-300 mt-1.5 pl-0.5">
                People &nbsp;Faster &nbsp;Safer
              </p>
            </Link>

            <div className="text-right">
              <p className="text-[10px] uppercase font-semibold tracking-[0.22em] text-neutral-300 leading-[1.45]">
                Emergency<br />
                Response<br />
                For A Safer<br />
                Tomorrow
              </p>
            </div>
          </div>

          {/* Bottom Hero Typography */}
          <div className="max-w-lg pb-2">
            <div className="w-10 h-[2px] bg-white mb-4" />
            <Link href="/" className="block group cursor-pointer hover:opacity-90 transition-opacity">
              <h1 className="text-3xl xl:text-[44px] font-black text-white tracking-tight leading-none uppercase mb-2.5">
                Gabriel
              </h1>
            </Link>
            <p className="text-xl xl:text-[26px] font-semibold text-white leading-tight tracking-tight mb-3">
              Coordinating every second that matters.
            </p>
            <p className="text-xs xl:text-sm text-neutral-300 font-normal leading-relaxed">
              Faster response. Safer communities.<br />
              A more prepared tomorrow.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Independent Scroll Container */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 bg-[#FFFFFF]">
        {/* Top Right Tagline */}
        <div className="flex items-center justify-end gap-3 text-xs font-medium text-neutral-400 tracking-wide">
          <span>A safer tomorrow. Together.</span>
          <div className="w-8 h-[1.5px] bg-neutral-300 rounded-full" />
        </div>

        {/* Mobile Header Brand (Only on mobile/tablet) */}
        <div className="lg:hidden mt-2 mb-2 pb-3 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 text-[#141414] font-extrabold text-xl tracking-[0.3em] uppercase">
                <span>G</span>
                <span>Λ</span>
                <span>B</span>
                <span>R</span>
                <span>I</span>
                <span>E</span>
                <span>L</span>
              </div>
              <p className="text-[9px] uppercase font-semibold tracking-[0.25em] text-neutral-400 mt-0.5">
                People Faster Safer
              </p>
            </div>
          </div>
        </div>

        {/* Centered Form Body */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-4">
          <div className="mb-6">
            <h2 className="text-3xl sm:text-[38px] font-extrabold text-[#111111] tracking-[-0.03em] leading-none mb-2.5">
              Create account.
            </h2>
            <p className="text-sm sm:text-[15px] text-neutral-400 font-normal leading-snug">
              Register to report emergencies and track real-time response.
            </p>
          </div>

          <RegisterForm />
        </div>

        {/* Bottom Spacer/Footer Note */}
        <div className="text-center pt-3 text-[10px] text-neutral-400">
          Gabriel Emergency Autonomous Response Network &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
