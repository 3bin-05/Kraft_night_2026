"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types/auth";
import { IncidentSeverity } from "@/types/incident";
import { AmbulanceLevel, AMBULANCE_LEVEL_CONFIGS } from "@/types/ambulance";
import { validateEmail, validatePhone, validatePassword } from "@/lib/validation";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Truck,
  Building2,
  MapPin,
  FileText,
  Navigation,
  Shield,
  LocateFixed,
  Bed,
  Check,
  Activity,
  HeartPulse,
  AlertTriangle,
  Zap,
  Stethoscope,
  Sparkles,
  Radio,
  Layers,
  Info,
} from "lucide-react";

export const SEVERITY_CAPABILITY_OPTIONS: Array<{
  value: IncidentSeverity;
  label: string;
  badge: string;
  description: string;
  tagColor: string;
  activeBorder: string;
  activeBg: string;
}> = [
  {
    value: "LOW",
    label: "Minor",
    badge: "Minor Cases",
    description: "Minor lacerations, first-aid, outpatient trauma",
    tagColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    activeBorder: "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30",
    activeBg: "bg-emerald-600 text-white",
  },
  {
    value: "MODERATE",
    label: "Moderate",
    badge: "Moderate Cases",
    description: "Stable fractures, deep wounds, standard ER admissions",
    tagColor: "bg-amber-100 text-amber-800 border-amber-300",
    activeBorder: "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500/30",
    activeBg: "bg-amber-600 text-white",
  },
  {
    value: "HIGH",
    label: "Severe",
    badge: "Severe Cases",
    description: "Major collisions, serious multi-casualty trauma, emergency surgery",
    tagColor: "bg-orange-100 text-orange-800 border-orange-300",
    activeBorder: "border-orange-500 bg-orange-50/50 ring-1 ring-orange-500/30",
    activeBg: "bg-orange-600 text-white",
  },
  {
    value: "CRITICAL",
    label: "Life-Threatening",
    badge: "Life-Threatening",
    description: "Cardiac arrest, severe hemorrhage, immediate ICU resuscitation",
    tagColor: "bg-rose-100 text-rose-800 border-rose-300",
    activeBorder: "border-rose-500 bg-rose-50/50 ring-1 ring-rose-500/30",
    activeBg: "bg-rose-600 text-white",
  },
];

export function RegisterForm() {
  const { register } = useAuth();

  // Role Category
  const [role, setRole] = useState<UserRole>("CITIZEN");

  // Common Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Ambulance Specific Fields
  const [ambulanceType, setAmbulanceType] = useState<AmbulanceLevel>("TYPE_C");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [callSign, setCallSign] = useState("");
  const [baseStation, setBaseStation] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [equipmentList, setEquipmentList] = useState<string[]>(
    AMBULANCE_LEVEL_CONFIGS.TYPE_C.defaultEquipment
  );
  const [ambLatitude, setAmbLatitude] = useState<string>("9.9312");
  const [ambLongitude, setAmbLongitude] = useState<string>("76.2673");
  const [detectingAmbCoords, setDetectingAmbCoords] = useState(false);

  const handleSelectAmbulanceLevel = (lvl: AmbulanceLevel) => {
    setAmbulanceType(lvl);
    setEquipmentList(AMBULANCE_LEVEL_CONFIGS[lvl].defaultEquipment);
  };

  const toggleEquipmentItem = (item: string) => {
    setEquipmentList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSelectAllEquipment = () => {
    const defaultList = AMBULANCE_LEVEL_CONFIGS[ambulanceType].defaultEquipment;
    if (equipmentList.length === defaultList.length) {
      setEquipmentList([defaultList[0]]);
    } else {
      setEquipmentList(defaultList);
    }
  };

  const handleDetectAmbCoords = () => {
    if ("geolocation" in navigator) {
      setDetectingAmbCoords(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setAmbLatitude(pos.coords.latitude.toFixed(4));
          setAmbLongitude(pos.coords.longitude.toFixed(4));
          setDetectingAmbCoords(false);
        },
        () => {
          setDetectingAmbCoords(false);
        }
      );
    }
  };

  // Hospital Specific Fields
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalRegistrationNumber, setHospitalRegistrationNumber] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<string>("9.9312");
  const [longitude, setLongitude] = useState<string>("76.2673");
  const [totalBeds, setTotalBeds] = useState<string>("12");
  const [handledSeverities, setHandledSeverities] = useState<IncidentSeverity[]>([
    "LOW",
    "MODERATE",
    "HIGH",
    "CRITICAL",
  ]);

  const toggleSeverity = (sev: IncidentSeverity) => {
    setHandledSeverities((prev) => {
      if (prev.includes(sev)) {
        return prev.filter((s) => s !== sev);
      } else {
        return [...prev, sev];
      }
    });
  };

  const handleSelectAllSeverities = () => {
    if (handledSeverities.length === SEVERITY_CAPABILITY_OPTIONS.length) {
      setHandledSeverities(["LOW"]);
    } else {
      setHandledSeverities(SEVERITY_CAPABILITY_OPTIONS.map((o) => o.value));
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectingCoords, setDetectingCoords] = useState(false);

  // Geolocation auto-detector for Hospital
  const handleDetectCoords = () => {
    if ("geolocation" in navigator) {
      setDetectingCoords(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(4));
          setLongitude(pos.coords.longitude.toFixed(4));
          setDetectingCoords(false);
        },
        () => {
          setDetectingCoords(false);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name =
        role === "HOSPITAL"
          ? "Contact administrator name is required."
          : "Full name is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required for dispatch communication.";
    } else if (!validatePhone(phone)) {
      newErrors.phone = "Please enter a valid phone number (digits only).";
    }

    // Role specific validation
    if (role === "AMBULANCE") {
      if (!vehicleNumber.trim()) {
        newErrors.vehicleNumber = "Vehicle registration number is required (e.g. KL-07-DR-8421).";
      }
    }

    if (role === "HOSPITAL") {
      if (!hospitalName.trim()) {
        newErrors.hospitalName = "Official hospital facility name is required.";
      }
      if (!address.trim()) {
        newErrors.address = "Hospital address is required.";
      }
      if (!pincode.trim()) {
        newErrors.pincode = "Postal pincode is required.";
      }
      if (handledSeverities.length === 0) {
        newErrors.handledSeverities =
          "Please select at least one case severity capability your facility can handle.";
      }
    }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      newErrors.password = passCheck.message || "Password must be at least 6 characters.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        vehicleNumber: role === "AMBULANCE" ? vehicleNumber.trim() : undefined,
        ambulanceType: role === "AMBULANCE" ? ambulanceType : undefined,
        callSign: role === "AMBULANCE" ? callSign.trim() || undefined : undefined,
        baseStation: role === "AMBULANCE" ? baseStation.trim() || undefined : undefined,
        vehicleModel: role === "AMBULANCE" ? vehicleModel.trim() || undefined : undefined,
        equipmentLevel: role === "AMBULANCE" ? ambulanceType : undefined,
        equipmentList: role === "AMBULANCE" ? equipmentList : undefined,
        hospitalName: role === "HOSPITAL" ? hospitalName.trim() || undefined : undefined,
        hospitalRegistrationNumber: role === "HOSPITAL" ? hospitalRegistrationNumber.trim() || undefined : undefined,
        address: role === "HOSPITAL" ? address.trim() || undefined : undefined,
        pincode: role === "HOSPITAL" ? pincode.trim() || undefined : undefined,
        latitude:
          role === "HOSPITAL"
            ? latitude ? parseFloat(latitude) : undefined
            : role === "AMBULANCE"
            ? ambLatitude ? parseFloat(ambLatitude) : undefined
            : undefined,
        longitude:
          role === "HOSPITAL"
            ? longitude ? parseFloat(longitude) : undefined
            : role === "AMBULANCE"
            ? ambLongitude ? parseFloat(ambLongitude) : undefined
            : undefined,
        totalBeds: role === "HOSPITAL" && totalBeds ? parseInt(totalBeds, 10) : undefined,
        handledSeverities: role === "HOSPITAL" ? handledSeverities : undefined,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please verify the submitted details.";
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAmbulanceConfig = AMBULANCE_LEVEL_CONFIGS[ambulanceType];

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Category Role Selection Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
            Account Category
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#F3F4F6] rounded-2xl border border-neutral-200/80">
            {/* Citizen Tab */}
            <button
              type="button"
              onClick={() => {
                setRole("CITIZEN");
                setErrors({});
              }}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                role === "CITIZEN"
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-neutral-500 hover:text-black font-semibold"
              }`}
            >
              <User className="w-4 h-4 mb-1" />
              <span className="text-[11px] leading-tight">Citizen</span>
            </button>

            {/* Ambulance Tab */}
            <button
              type="button"
              onClick={() => {
                setRole("AMBULANCE");
                setErrors({});
              }}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                role === "AMBULANCE"
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-neutral-500 hover:text-black font-semibold"
              }`}
            >
              <Truck className="w-4 h-4 mb-1" />
              <span className="text-[11px] leading-tight">Ambulance</span>
            </button>

            {/* Hospital Tab */}
            <button
              type="button"
              onClick={() => {
                setRole("HOSPITAL");
                setErrors({});
              }}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                role === "HOSPITAL"
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-neutral-500 hover:text-black font-semibold"
              }`}
            >
              <Building2 className="w-4 h-4 mb-1" />
              <span className="text-[11px] leading-tight">Hospital</span>
            </button>
          </div>
        </div>

        {/* General Error Alert */}
        {errors.general && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-50/80 border border-red-200 text-red-700 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errors.general}</span>
          </div>
        )}

        {/* ── AMBULANCE SPECIFIC DETAILS ── */}
        {role === "AMBULANCE" && (
          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex flex-col gap-3.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-black" />
                <span>Ambulance Unit & Classification</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-800">
                AIS 125 Standard
              </span>
            </div>

            {/* ── 1. AMBULANCE LEVEL SELECTION (A, B, C, D) ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#141414] uppercase tracking-wider">
                    Ambulance Type / Level *
                  </label>
                  <p className="text-[10px] text-neutral-500">
                    Select the national standard vehicle specification tier:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(AMBULANCE_LEVEL_CONFIGS) as AmbulanceLevel[]).map((levelKey) => {
                  const cfg = AMBULANCE_LEVEL_CONFIGS[levelKey];
                  const isSelected = ambulanceType === levelKey;

                  return (
                    <button
                      key={levelKey}
                      type="button"
                      onClick={() => handleSelectAmbulanceLevel(levelKey)}
                      className={`flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? `${cfg.activeBorder} shadow-sm bg-white`
                          : "bg-white/80 border-neutral-200/80 hover:border-neutral-300 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-extrabold text-[11px] shrink-0 ${
                              isSelected
                                ? cfg.activeBg
                                : "bg-neutral-200 text-neutral-700"
                            }`}
                          >
                            {cfg.letter}
                          </span>
                          <span className="text-xs font-bold text-[#141414]">
                            Level {cfg.letter}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cfg.tagColor}`}
                        >
                          {cfg.badge}
                        </span>
                      </div>

                      <div className="text-[10.5px] font-semibold text-neutral-700 mb-0.5">
                        {cfg.name}
                      </div>

                      <p className="text-[9.5px] text-neutral-500 leading-tight line-clamp-2">
                        {cfg.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 2. SELECTED LEVEL SPECIFICATION & EQUIPMENT CHECKLIST ── */}
            <div className="p-2.5 rounded-xl bg-white border border-neutral-200/90 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-4 h-4 rounded-md flex items-center justify-center font-black text-[10px] ${selectedAmbulanceConfig.activeBg}`}
                  >
                    {selectedAmbulanceConfig.letter}
                  </span>
                  <span className="text-[11px] font-bold text-[#141414]">
                    Level {selectedAmbulanceConfig.letter} Certified Equipment
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllEquipment}
                  className="text-[10px] font-semibold text-neutral-600 hover:text-black underline cursor-pointer"
                >
                  {equipmentList.length === selectedAmbulanceConfig.defaultEquipment.length
                    ? "Reset Standard Kit"
                    : "Select All Kit"}
                </button>
              </div>

              <p className="text-[10px] text-neutral-500 leading-snug">
                <strong>Clinical Target:</strong> {selectedAmbulanceConfig.targetAcuity} &bull; <em>{selectedAmbulanceConfig.vehicleCategory}</em>
              </p>

              {/* Equipment Items Grid */}
              <div className="grid grid-cols-1 gap-1.5 mt-0.5">
                {selectedAmbulanceConfig.defaultEquipment.map((eq) => {
                  const isChecked = equipmentList.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleEquipmentItem(eq)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isChecked
                          ? "bg-neutral-50 border-neutral-300 text-black font-medium"
                          : "bg-white border-neutral-200/60 text-neutral-400 opacity-60"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-all ${
                          isChecked
                            ? `${selectedAmbulanceConfig.activeBg} border-transparent`
                            : "border-neutral-300 bg-neutral-100"
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] leading-tight">{eq}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 3. VEHICLE REGISTRATION & MODEL ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#141414] mb-1">
                  Vehicle Registration No. *
                </label>
                <div
                  className={`relative flex items-center bg-white rounded-xl px-3 py-2 border ${
                    errors.vehicleNumber ? "border-red-400 bg-red-50/20" : "border-neutral-200 focus-within:border-black"
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. KL-07-DR-8421"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    required
                    className="w-full bg-transparent text-xs text-[#141414] placeholder:text-neutral-400 focus:outline-none uppercase"
                  />
                </div>
                {errors.vehicleNumber && (
                  <p className="mt-1 text-[10px] text-red-600">{errors.vehicleNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#141414] mb-1">
                  Vehicle Model / Chassis
                </label>
                <div className="relative flex items-center bg-white rounded-xl px-3 py-2 border border-neutral-200 focus-within:border-black">
                  <Shield className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. Force Traveller / Tata Winger"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#141414] placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ── 4. UNIT CALL SIGN & BASE STATION ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#141414] mb-1">
                  Unit Radio Call Sign
                </label>
                <div className="relative flex items-center bg-white rounded-xl px-3 py-2 border border-neutral-200 focus-within:border-black">
                  <Radio className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. MEDIC-01"
                    value={callSign}
                    onChange={(e) => setCallSign(e.target.value.toUpperCase())}
                    className="w-full bg-transparent text-xs text-[#141414] placeholder:text-neutral-400 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#141414] mb-1">
                  Base Station / Operating Hub
                </label>
                <div className="relative flex items-center bg-white rounded-xl px-3 py-2 border border-neutral-200 focus-within:border-black">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. Fort Kochi EMS Post"
                    value={baseStation}
                    onChange={(e) => setBaseStation(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#141414] placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ── 5. BASE GPS COORDINATES (AUTO-DETECT) ── */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-[#141414]">
                  Base Station GPS Coordinates (Lat / Lng)
                </label>
                <button
                  type="button"
                  onClick={handleDetectAmbCoords}
                  disabled={detectingAmbCoords}
                  className="text-[10px] text-neutral-600 hover:text-black font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <LocateFixed className="w-3 h-3" />
                  <span>{detectingAmbCoords ? "Detecting..." : "Auto-Detect"}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Latitude (e.g. 9.9312)"
                  value={ambLatitude}
                  onChange={(e) => setAmbLatitude(e.target.value)}
                  className="bg-white rounded-xl px-3 py-2 border border-neutral-200 text-xs focus:outline-none focus:border-black"
                />
                <input
                  type="text"
                  placeholder="Longitude (e.g. 76.2673)"
                  value={ambLongitude}
                  onChange={(e) => setAmbLongitude(e.target.value)}
                  className="bg-white rounded-xl px-3 py-2 border border-neutral-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── HOSPITAL SPECIFIC DETAILS ── */}
        {role === "HOSPITAL" && (
          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex flex-col gap-3 animate-fade-in">
            <div className="text-[11px] font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospital Facility Details</span>
            </div>

            {/* Hospital Name & Registration Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#141414] mb-1">
                  Official Hospital Name *
                </label>
                <div
                  className={`relative flex items-center bg-white rounded-xl px-3 py-2.5 border ${
                    errors.hospitalName ? "border-red-400 bg-red-50/20" : "border-neutral-200 focus-within:border-black"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. Lakeshore General"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    required
                    className="w-full bg-transparent text-xs text-[#141414] placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
                {errors.hospitalName && (
                  <p className="mt-1 text-[10px] text-red-600">{errors.hospitalName}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#141414] mb-1">
                  Hospital Number / Reg Code *
                </label>
                <div
                  className={`relative flex items-center bg-white rounded-xl px-3 py-2.5 border ${
                    errors.hospitalRegistrationNumber ? "border-red-400 bg-red-50/20" : "border-neutral-200 focus-within:border-black"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. HOSP-KER-0842"
                    value={hospitalRegistrationNumber}
                    onChange={(e) => setHospitalRegistrationNumber(e.target.value.toUpperCase())}
                    className="w-full bg-transparent text-xs text-[#141414] placeholder:text-neutral-400 focus:outline-none uppercase"
                  />
                </div>
                {errors.hospitalRegistrationNumber && (
                  <p className="mt-1 text-[10px] text-red-600">{errors.hospitalRegistrationNumber}</p>
                )}
              </div>
            </div>

            {/* Address & Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#141414] mb-1">
                  Facility Location / Address *
                </label>
                <div
                  className={`relative flex items-center bg-white rounded-xl px-3 py-2.5 border ${
                    errors.address ? "border-red-400 bg-red-50/20" : "border-neutral-200 focus-within:border-black"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. NH 66 Bypass, Maradu, Kochi"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full bg-transparent text-xs text-[#141414] placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-[10px] text-red-600">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#141414] mb-1">
                  Pincode *
                </label>
                <div
                  className={`relative flex items-center bg-white rounded-xl px-3 py-2.5 border ${
                    errors.pincode ? "border-red-400 bg-red-50/20" : "border-neutral-200 focus-within:border-black"
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. 682040"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                    className="w-full bg-transparent text-xs text-[#141414] placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
                {errors.pincode && (
                  <p className="mt-1 text-[10px] text-red-600">{errors.pincode}</p>
                )}
              </div>
            </div>

            {/* Coordinates (Latitude & Longitude) with GPS Autofill */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-[#141414]">
                  GPS Coordinates (Lat / Lng)
                </label>
                <button
                  type="button"
                  onClick={handleDetectCoords}
                  disabled={detectingCoords}
                  className="text-[10px] text-neutral-600 hover:text-black font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <LocateFixed className="w-3 h-3" />
                  <span>{detectingCoords ? "Detecting..." : "Auto-Detect"}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Latitude (e.g. 9.9312)"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="bg-white rounded-xl px-3 py-2 border border-neutral-200 text-xs focus:outline-none focus:border-black"
                />
                <input
                  type="text"
                  placeholder="Longitude (e.g. 76.2673)"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="bg-white rounded-xl px-3 py-2 border border-neutral-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {/* Trauma Bed Capacity */}
            <div>
              <label className="block text-[11px] font-semibold text-[#141414] mb-1">
                Emergency Bed Capacity
              </label>
              <div className="relative flex items-center bg-white rounded-xl px-3 py-2 border border-neutral-200 focus-within:border-black">
                <Bed className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g. 12"
                  value={totalBeds}
                  onChange={(e) => setTotalBeds(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#141414] placeholder:text-neutral-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Handled Case Severity Capabilities */}
            <div className="pt-2 border-t border-neutral-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#141414] uppercase tracking-wider">
                    Handled Case Severity *
                  </label>
                  <p className="text-[10px] text-neutral-500">
                    Select case severities this facility can handle:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllSeverities}
                  className="text-[10px] font-semibold text-neutral-600 hover:text-black underline cursor-pointer shrink-0"
                >
                  {handledSeverities.length === SEVERITY_CAPABILITY_OPTIONS.length
                    ? "Deselect Others"
                    : "Select All (4 Levels)"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                {SEVERITY_CAPABILITY_OPTIONS.map((opt) => {
                  const isSelected = handledSeverities.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleSeverity(opt.value)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? `${opt.activeBorder} shadow-sm`
                          : "bg-white border-neutral-200/80 hover:border-neutral-300 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? `${opt.activeBg} border-transparent`
                            : "border-neutral-300 bg-neutral-100"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-[#141414]">
                            {opt.label}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${opt.tagColor}`}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-tight">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.handledSeverities && (
                <p className="mt-1.5 text-[10px] text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.handledSeverities}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── STANDARD CREDENTIALS ── */}
        {/* Full Name / Admin Contact */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#141414] mb-1.5">
            {role === "HOSPITAL" ? "Contact Administrator Name" : "Full Name"}
          </label>
          <div
            className={`relative flex items-center bg-[#F4F4F6] rounded-2xl px-4 py-3 transition-all border ${
              errors.name
                ? "border-red-400 bg-red-50/30"
                : "border-transparent focus-within:border-neutral-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5"
            }`}
          >
            <User className="w-5 h-5 text-neutral-400 mr-3 shrink-0" strokeWidth={1.8} />
            <input
              type="text"
              placeholder={
                role === "HOSPITAL"
                  ? "e.g. Dr. Anand Kumar"
                  : role === "AMBULANCE"
                  ? "e.g. Vikram S. (Driver)"
                  : "e.g. Sarah Connor"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoComplete="name"
              required
              className="w-full bg-transparent text-sm text-[#141414] placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.name}</p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#141414] mb-1.5">
            {role === "HOSPITAL" ? "Official Hospital Email" : "Email Address"}
          </label>
          <div
            className={`relative flex items-center bg-[#F4F4F6] rounded-2xl px-4 py-3 transition-all border ${
              errors.email
                ? "border-red-400 bg-red-50/30"
                : "border-transparent focus-within:border-neutral-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5"
            }`}
          >
            <Mail className="w-5 h-5 text-neutral-400 mr-3 shrink-0" strokeWidth={1.8} />
            <input
              type="email"
              placeholder={
                role === "HOSPITAL"
                  ? "emergency@lakeshore.org"
                  : role === "AMBULANCE"
                  ? "driver@ambulance.network"
                  : "name@example.com"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
              required
              className="w-full bg-transparent text-sm text-[#141414] placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.email}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#141414] mb-1.5">
            {role === "HOSPITAL" ? "Emergency Desk Phone" : "Phone Number"}
          </label>
          <div
            className={`relative flex items-center bg-[#F4F4F6] rounded-2xl px-4 py-3 transition-all border ${
              errors.phone
                ? "border-red-400 bg-red-50/30"
                : "border-transparent focus-within:border-neutral-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5"
            }`}
          >
            <Phone className="w-5 h-5 text-neutral-400 mr-3 shrink-0" strokeWidth={1.8} />
            <input
              type="tel"
              placeholder="e.g. 9847012345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
              autoComplete="tel"
              required
              className="w-full bg-transparent text-sm text-[#141414] placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.phone}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#141414] mb-1.5">
            Password
          </label>
          <div
            className={`relative flex items-center bg-[#F4F4F6] rounded-2xl px-4 py-3 transition-all border ${
              errors.password
                ? "border-red-400 bg-red-50/30"
                : "border-transparent focus-within:border-neutral-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5"
            }`}
          >
            <Lock className="w-5 h-5 text-neutral-400 mr-3 shrink-0" strokeWidth={1.8} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="new-password"
              required
              className="w-full bg-transparent text-sm text-[#141414] placeholder:text-neutral-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-neutral-700 transition p-1 focus:outline-none shrink-0"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" strokeWidth={1.8} />
              ) : (
                <Eye className="w-4 h-4" strokeWidth={1.8} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#141414] mb-1.5">
            Confirm Password
          </label>
          <div
            className={`relative flex items-center bg-[#F4F4F6] rounded-2xl px-4 py-3 transition-all border ${
              errors.confirmPassword
                ? "border-red-400 bg-red-50/30"
                : "border-transparent focus-within:border-neutral-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5"
            }`}
          >
            <Lock className="w-5 h-5 text-neutral-400 mr-3 shrink-0" strokeWidth={1.8} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="new-password"
              required
              className="w-full bg-transparent text-sm text-[#141414] placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 bg-[#111111] hover:bg-[#262626] active:scale-[0.99] text-white py-3.5 px-6 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>
                {role === "CITIZEN"
                  ? "Create Citizen Account"
                  : role === "AMBULANCE"
                  ? "Register Ambulance Unit"
                  : "Register Hospital Facility"}
              </span>
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </>
          )}
        </button>

        {/* Login Link */}
        <p className="text-center text-xs sm:text-sm text-neutral-500 mt-1">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-[#141414] hover:underline inline-flex items-center gap-1"
          >
            Log In <ArrowRight className="w-3.5 h-3.5 inline" />
          </Link>
        </p>
      </form>
    </div>
  );
}
