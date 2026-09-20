import { NextResponse } from "next/server";
import { getHospitals } from "@/lib/db";

export async function GET() {
  try {
    const hospitals = await getHospitals();
    return NextResponse.json({ hospitals }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load hospitals.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
