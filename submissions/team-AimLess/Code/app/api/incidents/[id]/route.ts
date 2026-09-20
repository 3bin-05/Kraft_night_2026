import { NextResponse } from "next/server";
import { getIncidentById, updateIncident, updateAmbulance } from "@/lib/db";
import { broadcastEvent } from "@/lib/events";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incident = await getIncidentById(id);

    if (!incident) {
      return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    }

    return NextResponse.json({ incident }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch incident.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, assignedAmbulanceId, targetHospitalId } = body;

    const updated = await updateIncident(id, {
      status,
      assignedAmbulanceId,
      targetHospitalId,
    });

    if (!updated) {
      return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    }

    // Broadcast real-time updates
    broadcastEvent("incident:updated", { incident: updated });

    if (status) {
      broadcastEvent("incident:status_changed", {
        incidentId: updated.id,
        status: updated.status,
        incident: updated,
      });
    }

    if (assignedAmbulanceId) {
      broadcastEvent("ambulance:assigned", {
        incidentId: updated.id,
        ambulanceId: assignedAmbulanceId,
        incident: updated,
      });
    }

    if (targetHospitalId || status === "HOSPITAL_NOTIFIED") {
      broadcastEvent("hospital:alert", {
        incidentId: updated.id,
        hospitalId: updated.targetHospitalId || "hosp_001",
        incident: updated,
      });
    }

    if (status === "CLOSED" && updated.assignedAmbulanceId) {
      await updateAmbulance(updated.assignedAmbulanceId, {
        status: "AVAILABLE",
        currentIncidentId: null,
      });
      broadcastEvent("ambulance:status_changed", {
        ambulanceId: updated.assignedAmbulanceId,
        status: "AVAILABLE",
      });
    }

    return NextResponse.json(
      {
        incident: updated,
        message: `Incident status updated to ${updated.status}`,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update incident.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
