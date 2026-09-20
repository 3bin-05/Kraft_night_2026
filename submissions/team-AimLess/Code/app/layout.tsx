import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { OfflineBanner } from "@/components/ui/OfflineBanner";

export const metadata: Metadata = {
  title: "AIMLESS — Emergency Response Network",
  description:
    "Cooperative emergency response system for road accidents connecting citizens, ambulances, hospitals, and command centers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-[#FFFFFF] text-[#141414] antialiased selection:bg-[#141414] selection:text-[#FFFFFF]">
        <AuthProvider>
          <OfflineBanner />
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
