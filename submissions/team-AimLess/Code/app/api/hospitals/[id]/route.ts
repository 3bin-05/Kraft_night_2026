import { NextResponse } from "next/server";
import { updateHospital } from "@/lib/db";
import { broadcastEvent } from "@/lib/events";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, availableBeds, emergencyDepartmentStatus } = body;

    const updated = await updateHospital(id, {
      status,
      availableBeds,
      emergencyDepartmentStatus,
    });

    if (!updated) {
      return NextResponse.json({ error: "Hospital not found." }, { status: 404 });
    }

    // Broadcast real-time hospital updates
    broadcastEvent("hospital:status_updated", {
      hospitalId: id,
      readinessState: updated.emergencyDepartmentStatus || "IDLE",
      availableBeds: updated.availableBeds,
    });

    return NextResponse.json(
      { hospital: updated, message: "Hospital status updated." },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update hospital.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
