import { NextResponse } from "next/server";
import { updateAmbulance } from "@/lib/db";
import { broadcastEvent } from "@/lib/events";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, currentIncidentId, currentHospitalId, latitude, longitude, speed, heading } = body;

    const updated = await updateAmbulance(id, {
      status,
      currentIncidentId,
      currentHospitalId,
      latitude,
      longitude,
      speed,
      heading,
    });

    if (!updated) {
      return NextResponse.json({ error: "Ambulance not found." }, { status: 404 });
    }

    if (status) {
      broadcastEvent("ambulance:status_changed", {
        ambulanceId: id,
        status: updated.status,
      });
    }

    if (typeof latitude === "number" && typeof longitude === "number") {
      broadcastEvent("ambulance:location_updated", {
        ambulanceId: id,
        latitude,
        longitude,
        speed,
        heading,
      });
    }

    return NextResponse.json({ ambulance: updated, message: "Ambulance telemetry updated." }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update ambulance.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
