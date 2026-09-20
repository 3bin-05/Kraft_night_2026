export type AmbulanceStatus = "AVAILABLE" | "RESPONDING" | "TRANSPORTING" | "OFFLINE";

export type AmbulanceLevel = "TYPE_A" | "TYPE_B" | "TYPE_C" | "TYPE_D";

export interface AmbulanceLevelOption {
  value: AmbulanceLevel;
  letter: string;
  name: string;
  shortTitle: string;
  badge: string;
  vehicleCategory: string;
  description: string;
  targetAcuity: string;
  defaultEquipment: string[];
  tagColor: string;
  activeBorder: string;
  activeBg: string;
}

export const AMBULANCE_LEVEL_CONFIGS: Record<AmbulanceLevel, AmbulanceLevelOption> = {
  TYPE_A: {
    value: "TYPE_A",
    letter: "A",
    name: "Medical First Responder (MFR)",
    shortTitle: "Level A • First Responder",
    badge: "First Responder / Triage",
    vehicleCategory: "Rapid Response Bike / Light Intervention",
    description: "Rapid on-scene triage, initial stabilization, CPR/AED, and hemorrhage control before heavy transport arrival.",
    targetAcuity: "Immediate On-Scene Triage & First-Aid",
    defaultEquipment: [
      "Automated External Defibrillator (AED)",
      "Trauma & Hemorrhage Dressing Kit",
      "Portable Oxygen Resuscitation Kit",
      "Triage Protocol Cards & Cervical Collars",
      "Emergency Vitals Diagnostic Kit",
    ],
    tagColor: "bg-sky-100 text-sky-800 border-sky-300",
    activeBorder: "border-sky-500 bg-sky-50/50 ring-1 ring-sky-500/30",
    activeBg: "bg-sky-600 text-white",
  },
  TYPE_B: {
    value: "TYPE_B",
    letter: "B",
    name: "Patient Transport Ambulance (PTA)",
    shortTitle: "Level B • Patient Transport",
    badge: "Basic Transport / Low-Acuity",
    vehicleCategory: "Standard Patient Transport Van",
    description: "Conveyance of non-urgent or stable patients who require basic comfort, transport positioning, and light monitoring.",
    targetAcuity: "Stable / Non-Urgent Medical Conveyance",
    defaultEquipment: [
      "Main Wheeled Patient Stretcher",
      "Foldable Stair Carry Chair",
      "Fixed Low-Flow Oxygen System (10L)",
      "Standard Vital Signs Monitor (BP / Pulse Oximeter)",
      "Basic Medical First-Aid Kit",
    ],
    tagColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    activeBorder: "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30",
    activeBg: "bg-emerald-600 text-white",
  },
  TYPE_C: {
    value: "TYPE_C",
    letter: "C",
    name: "Basic Life Support (BLS)",
    shortTitle: "Level C • Basic Life Support",
    badge: "Emergency BLS / Trauma Response",
    vehicleCategory: "Emergency Medical Van (BLS)",
    description: "Emergency road accident response, moderate trauma support, continuous vitals telemetry, and basic resuscitation.",
    targetAcuity: "Moderate to Serious Trauma Emergencies",
    defaultEquipment: [
      "AED with Live ECG Rhythm Monitoring",
      "Multi-Size Bag-Valve-Mask (BVM) Resuscitators",
      "Electric & Manual Airway Suction Unit",
      "Full Spinal Immobilization Board & Scoop Stretcher",
      "IV Starter Packs & Fracture Splinting Kit",
      "High-Flow Oxygen Delivery System",
    ],
    tagColor: "bg-amber-100 text-amber-800 border-amber-300",
    activeBorder: "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500/30",
    activeBg: "bg-amber-600 text-white",
  },
  TYPE_D: {
    value: "TYPE_D",
    letter: "D",
    name: "Advanced Life Support / Mobile ICU (ALS)",
    shortTitle: "Level D • Advanced Life Support",
    badge: "Mobile ICU / Critical Care",
    vehicleCategory: "Heavy Critical Care Mobile ICU (ALS)",
    description: "Highest level emergency response for cardiac arrest, severe multi-trauma, mechanical ventilation, and invasive life support.",
    targetAcuity: "Life-Threatening / Critical ICU Cases",
    defaultEquipment: [
      "Transport Mechanical Ventilator & Capnography (EtCO2)",
      "Multi-Parameter Defibrillator / 12-Lead ECG / Pacing",
      "Syringe & Volumetric Infusion Pumps",
      "Video Laryngoscope & Advanced Intubation Kit",
      "Emergency Resuscitation Pharmacology & Cold-Storage",
      "Central Oxygen & Dual-Line Suction",
    ],
    tagColor: "bg-rose-100 text-rose-800 border-rose-300",
    activeBorder: "border-rose-500 bg-rose-50/50 ring-1 ring-rose-500/30",
    activeBg: "bg-rose-600 text-white",
  },
};

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  status: AmbulanceStatus;
  type?: AmbulanceLevel;
  equipmentLevel?: string;
  equipmentList?: string[];
  callSign?: string;
  baseStation?: string;
  vehicleModel?: string;
  currentIncidentId?: string;
  currentHospitalId?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updatedAt: string;
}

export interface AmbulanceLocationUpdate {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}
