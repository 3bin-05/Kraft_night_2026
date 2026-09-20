"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types/auth";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, LogIn } from "lucide-react";
import Link from "next/link";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-[#141414] border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-[#707070] font-medium">Verifying authorization...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FFFFFF]">
        <Card variant="surface" className="max-w-md w-full text-center p-8 border border-red-200">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#141414] mb-2">Access Restricted</h2>
          <p className="text-sm text-[#707070] mb-6">
            Your current role (<strong className="text-[#141414]">{user.role}</strong>) does not have access to this portal.
          </p>
          <div className="flex flex-col gap-2">
            <Link href={`/${user.role.toLowerCase()}`}>
              <Button variant="primary" className="w-full justify-center">
                Go to My Dashboard
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full justify-center">
                <LogIn className="w-4 h-4 mr-2" /> Switch Account
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
