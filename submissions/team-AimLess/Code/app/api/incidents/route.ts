import { NextResponse } from "next/server";
import { getIncidents } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope"); // 'me' or 'all'
    const currentUser = await getCurrentUser();

    let incidents;
    if (scope === "me" && currentUser) {
      incidents = await getIncidents({ reporterId: currentUser.id });
    } else if (currentUser?.role === "ADMIN" || currentUser?.role === "AMBULANCE" || currentUser?.role === "HOSPITAL") {
      incidents = await getIncidents();
    } else if (currentUser) {
      // For citizen default to their reported incidents or recent
      incidents = await getIncidents({ reporterId: currentUser.id });
      if (incidents.length === 0) {
        // If citizen has no personal incidents, include latest system incidents for demo visibility
        incidents = await getIncidents({ limit: 10 });
      }
    } else {
      incidents = await getIncidents({ limit: 10 });
    }

    return NextResponse.json({ incidents }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch incidents.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
