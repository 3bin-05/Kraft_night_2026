import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null, error: "Authentication check failed" }, { status: 500 });
  }
}
