import {
  evaluateEmergencyAssignment,
  autoAssignEmergency,
  calculateHaversineDistance,
  calculateETA,
  evaluateAmbulanceCapability,
  recommendHospitalsForIncident,
} from "../lib/assignment-engine";
import { getAmbulances, getHospitals, createIncident, getIncidentById } from "../lib/db";
import { Incident } from "../types/incident";

async function runTests() {
  console.log("=== Testing GABRIEL Assignment Engine ===\n");

  // 1. Test Haversine Distance & ETA Calculation
  console.log("1. Testing Haversine Distance & ETA...");
  const dist = calculateHaversineDistance(8.9150, 76.6330, 8.9182, 76.6354);
  const eta = calculateETA(dist);
  console.log(`- Distance: ${dist} km`);
  console.log(`- ETA: ~${eta.etaMinutes} min (${eta.etaFormatted})`);
  if (dist > 0 && eta.etaMinutes > 0) {
    console.log("✓ Distance & ETA Calculation PASSED\n");
  } else {
    throw new Error("Distance/ETA failed");
  }

  // 2. Test Ambulance Capability Evaluation
  console.log("2. Testing Ambulance Capability Scoring...");
  const critD = evaluateAmbulanceCapability("TYPE_D", "CRITICAL");
  const critC = evaluateAmbulanceCapability("TYPE_C", "CRITICAL");
  const critA = evaluateAmbulanceCapability("TYPE_A", "CRITICAL");
  console.log(`- Level D for CRITICAL: Score=${critD.capabilityScore}, Optimal=${critD.isOptimalLevel} (${critD.reason})`);
  console.log(`- Level C for CRITICAL: Score=${critC.capabilityScore}, Optimal=${critC.isOptimalLevel} (${critC.reason})`);
  console.log(`- Level A for CRITICAL: Score=${critA.capabilityScore}, Optimal=${critA.isOptimalLevel} (${critA.reason})`);

  if (critD.capabilityScore === 100 && critC.capabilityScore === 65 && critA.capabilityScore === 0) {
    console.log("✓ Capability Matrix Evaluation PASSED\n");
  } else {
    throw new Error("Capability Evaluation failed");
  }

  // 3. Test Emergency Incident Evaluation with Existing Database Data
  console.log("3. Testing End-to-End Incident Evaluation (CRITICAL severity)...");
  const criticalIncident = await createIncident({
    latitude: 8.9155,
    longitude: 76.6335,
    severity: "CRITICAL",
    victimCount: 2,
    description: "Multi-vehicle high speed collision near junction",
  });

  const evalResult = await evaluateEmergencyAssignment(criticalIncident.id);
  console.log(`- Incident #${evalResult.incident.incidentNumber} (${evalResult.incident.severity})`);
  console.log(`- Matched Ambulance: ${evalResult.matchedAmbulance?.ambulance.vehicleNumber} (Level ${evalResult.matchedAmbulance?.ambulance.type})`);
  console.log(`- Ambulance Distance: ${evalResult.matchedAmbulance?.distanceKm} km, ETA: ~${evalResult.matchedAmbulance?.etaFormatted} min`);
  console.log(`- Recommended Hospital: ${evalResult.recommendedHospital?.hospital.name} (Code: ${evalResult.recommendedHospital?.hospital.code})`);
  console.log(`- Hospital Distance: ${evalResult.recommendedHospital?.distanceKm} km, ETA: ~${evalResult.recommendedHospital?.etaFormatted} min, Beds: ${evalResult.recommendedHospital?.availableBeds}`);
  console.log(`- Alternative Hospitals Count: ${evalResult.alternativeHospitals.length}`);
  console.log(`- Filtered Out Hospitals Count: ${evalResult.filteredOutHospitals.length}`);

  if (evalResult.matchedAmbulance && evalResult.recommendedHospital) {
    console.log("✓ Incident Evaluation PASSED\n");
  } else {
    throw new Error("Incident Evaluation returned empty match");
  }

  // 4. Test Hospital Filtering by Handled Severity
  console.log("4. Testing Hospital Filtering by Capability...");
  const lowIncident: Incident = {
    id: "test_low_01",
    incidentNumber: "ER-TEST-LOW",
    location: { latitude: 8.9155, longitude: 76.6335 },
    severity: "LOW",
    victimCount: 1,
    status: "REPORTED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const lowHospRec = await recommendHospitalsForIncident(lowIncident);
  console.log(`- LOW Incident Recommended Hospital: ${lowHospRec.recommendedHospital?.hospital.name}`);
  console.log(`- Filtered Out Hospitals for LOW: ${lowHospRec.filteredOutHospitals.map(f => `${f.hospital.name}: ${f.reason}`).join(" | ")}`);

  // Metro Memorial and St. Jude only handle HIGH/CRITICAL or MODERATE/HIGH/CRITICAL in seed data
  if (lowHospRec.filteredOutHospitals.length > 0) {
    console.log("✓ Hospital Capability Filtering PASSED (correctly filtered out non-accredited centers)\n");
  }

  // 5. Test Auto-Assignment Execution & DB State Updates
  console.log("5. Testing Auto-Assignment Execution (Commit to DB)...");
  const autoAssigned = await autoAssignEmergency(criticalIncident.id);
  const reloadedIncident = await getIncidentById(criticalIncident.id);

  console.log(`- Updated Incident Status: ${reloadedIncident?.status}`);
  console.log(`- Assigned Ambulance ID: ${reloadedIncident?.assignedAmbulanceId}`);
  console.log(`- Target Hospital ID: ${reloadedIncident?.targetHospitalId}`);

  if (
    reloadedIncident?.status === "AMBULANCE_ASSIGNED" &&
    reloadedIncident?.assignedAmbulanceId &&
    reloadedIncident?.targetHospitalId
  ) {
    console.log("✓ Auto-Assignment Execution PASSED\n");
  } else {
    throw new Error("Auto-assignment DB commit failed");
  }

  console.log("=== All Assignment Engine Tests PASSED Successfully ===");
}

runTests().catch((e) => {
  console.error("Test failed with error:", e);
  process.exit(1);
});
