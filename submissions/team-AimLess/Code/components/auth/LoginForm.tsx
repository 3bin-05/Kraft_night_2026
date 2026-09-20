"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { validateEmail } from "@/lib/validation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Zap,
  ChevronDown,
  ChevronUp,
  Shield,
  Truck,
  Building2,
  User as UserIcon,
} from "lucide-react";

export function LoginForm() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoRoles, setShowDemoRoles] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Please enter your password.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Invalid credentials. Please verify your email and password.";
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrors({});
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* General Error Message */}
        {errors.general && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-50/80 border border-red-200 text-red-700 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errors.general}</span>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#141414] mb-1.5">
            Email
          </label>
          <div
            className={`relative flex items-center bg-[#F4F4F6] rounded-2xl px-4 py-3.5 transition-all border ${
              errors.email
                ? "border-red-400 bg-red-50/30"
                : "border-transparent focus-within:border-neutral-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5"
            }`}
          >
            <Mail className="w-5 h-5 text-neutral-400 mr-3 shrink-0" strokeWidth={1.8} />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
              required
              className="w-full bg-transparent text-sm text-[#141414] placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#141414] mb-1.5">
            Password
          </label>
          <div
            className={`relative flex items-center bg-[#F4F4F6] rounded-2xl px-4 py-3.5 transition-all border ${
              errors.password
                ? "border-red-400 bg-red-50/30"
                : "border-transparent focus-within:border-neutral-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5"
            }`}
          >
            <Lock className="w-5 h-5 text-neutral-400 mr-3 shrink-0" strokeWidth={1.8} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
              required
              className="w-full bg-transparent text-sm text-[#141414] placeholder:text-neutral-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-neutral-700 transition p-1 focus:outline-none shrink-0"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" strokeWidth={1.8} />
              ) : (
                <Eye className="w-4 h-4" strokeWidth={1.8} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.password}</p>
          )}

          {/* Forgot Password Link */}
          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              onClick={() =>
                alert("Please contact your system administrator or dispatch supervisor to reset credentials.")
              }
              className="text-xs font-semibold text-[#141414] hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Primary Log In Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 bg-[#111111] hover:bg-[#262626] active:scale-[0.99] text-white py-3.5 sm:py-4 px-6 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Log In</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </>
          )}
        </button>

        {/* Create Account Link */}
        <p className="text-center text-xs sm:text-sm text-neutral-500 mt-1">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-[#141414] hover:underline inline-flex items-center gap-1"
          >
            Create one <ArrowRight className="w-3.5 h-3.5 inline" />
          </Link>
        </p>

        {/* OR Divider */}
        <div className="relative my-2 flex items-center justify-center">
          <div className="w-full border-t border-neutral-200" />
          <span className="absolute bg-white px-3 text-[11px] font-semibold text-neutral-400 tracking-wider">
            OR
          </span>
        </div>

        {/* Secondary Report Emergency Button */}
        <Link
          href="/emergency-report"
          className="w-full border border-neutral-900 bg-white hover:bg-neutral-50 active:scale-[0.99] text-[#111111] py-3.5 px-5 rounded-full font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm text-center"
        >
          <Zap className="w-4 h-4 fill-black text-black shrink-0" />
          <span>Report Emergency Without Signing In</span>
          <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2} />
        </Link>

        {/* Emergency Disclaimer */}
        <p className="text-center text-[11px] text-neutral-400 max-w-[340px] mx-auto leading-relaxed">
          In an emergency, you don&apos;t need an account. We&apos;ll use your phone&apos;s location
          to send help immediately.
        </p>
      </form>

      {/* Developer Demo Accounts Drawer */}
      <div className="mt-8 pt-4 border-t border-dashed border-neutral-200">
        <button
          type="button"
          onClick={() => setShowDemoRoles(!showDemoRoles)}
          className="w-full flex items-center justify-between text-left py-1 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Quick-Fill Demo Roles (Testing)
          </span>
          {showDemoRoles ? (
            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </button>

        {showDemoRoles && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs animate-fade-in">
            <button
              type="button"
              onClick={() => handleFillDemo("admin@aimless.local", "adminPassword123!")}
              className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-colors flex items-center gap-2"
            >
              <Shield className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-[#141414] text-[11px]">ADMIN</div>
                <div className="text-[10px] text-neutral-400 truncate">admin@aimless.local</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo("ambulance01@aimless.local", "ambulancePassword123!")}
              className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-colors flex items-center gap-2"
            >
              <Truck className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-[#141414] text-[11px]">AMBULANCE</div>
                <div className="text-[10px] text-neutral-400 truncate">ambulance01@aimless.local</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo("hospital01@aimless.local", "hospitalPassword123!")}
              className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-colors flex items-center gap-2"
            >
              <Building2 className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-[#141414] text-[11px]">HOSPITAL</div>
                <div className="text-[10px] text-neutral-400 truncate">hospital01@aimless.local</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo("citizen@aimless.local", "citizenPassword123!")}
              className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-colors flex items-center gap-2"
            >
              <UserIcon className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-[#141414] text-[11px]">CITIZEN</div>
                <div className="text-[10px] text-neutral-400 truncate">citizen@aimless.local</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
