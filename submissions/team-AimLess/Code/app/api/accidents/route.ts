import { NextResponse } from "next/server";
import { createIncident } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { IncidentSeverity } from "@/types/incident";
import { broadcastEvent } from "@/lib/events";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      latitude,
      longitude,
      locationAccuracy,
      severity,
      victimCount,
      description,
      phone,
    } = body;

    // Validate coordinates
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Valid GPS latitude and longitude coordinates are required." },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "GPS coordinates are out of valid geographical range." },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities: IncidentSeverity[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
    const normalizedSeverity: IncidentSeverity = validSeverities.includes(severity)
      ? severity
      : "CRITICAL";

    // Validate victim count
    const parsedVictims = parseInt(victimCount, 10);
    const validVictimCount = !isNaN(parsedVictims) && parsedVictims > 0 ? parsedVictims : 1;

    // Check if reporter is authenticated
    const currentUser = await getCurrentUser();

    const incident = await createIncident({
      latitude,
      longitude,
      locationAccuracy: typeof locationAccuracy === "number" ? locationAccuracy : undefined,
      severity: normalizedSeverity,
      victimCount: validVictimCount,
      description: typeof description === "string" ? description.trim() : undefined,
      reporterId: currentUser?.id,
      reporterPhone: currentUser?.phone || (typeof phone === "string" ? phone.trim() : undefined),
    });

    // Broadcast initial emergency alert
    broadcastEvent("incident:created", { incident });
    broadcastEvent("notification:new", {
      id: `notif_${Date.now()}`,
      title: `Emergency Incident #${incident.incidentNumber} Reported`,
      message: `${incident.severity} severity accident with ${incident.victimCount} casualty(s).`,
      timestamp: incident.createdAt,
    });

    // Automatically trigger the Assignment Engine to match optimal available ambulance & recommend trauma center
    let finalIncident = incident;
    try {
      const { autoAssignEmergency } = await import("@/lib/assignment-engine");
      const assignment = await autoAssignEmergency(incident.id);
      if (assignment.incident) {
        finalIncident = assignment.incident;
      }
    } catch (assignErr) {
      console.warn("[Assignment Engine Notice]:", assignErr);
    }

    return NextResponse.json(
      {
        incident: finalIncident,
        message: "Emergency reported and processed by assignment engine. Response units notified.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[Accidents API Error]:", err);
    const message = err instanceof Error ? err.message : "Failed to record emergency report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
