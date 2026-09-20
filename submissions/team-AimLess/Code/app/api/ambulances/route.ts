import { NextResponse } from "next/server";
import { getAmbulances, updateAmbulance } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const ambulances = await getAmbulances();
    return NextResponse.json({ ambulances }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load ambulances.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
