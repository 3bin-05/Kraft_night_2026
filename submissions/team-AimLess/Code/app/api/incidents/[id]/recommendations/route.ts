import { NextResponse } from "next/server";
import { evaluateEmergencyAssignment } from "@/lib/assignment-engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await evaluateEmergencyAssignment(id);

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate assignment recommendations.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
