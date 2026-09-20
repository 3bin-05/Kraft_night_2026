import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ message: "Logged out successfully." });
  } catch {
    return NextResponse.json({ error: "Failed to log out." }, { status: 500 });
  }
}
