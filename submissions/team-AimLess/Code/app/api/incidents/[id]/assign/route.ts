import { NextResponse } from "next/server";
import { autoAssignEmergency } from "@/lib/assignment-engine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body: { forceAmbulanceId?: string; forceHospitalId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const result = await autoAssignEmergency(id, {
      forceAmbulanceId: body.forceAmbulanceId,
      forceHospitalId: body.forceHospitalId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute emergency assignment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
