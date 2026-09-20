import { NextResponse } from "next/server";
import { createUser, createAmbulance, createHospital } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { validateEmail, validatePhone, validatePassword } from "@/lib/validation";
import { UserRole } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      role = "CITIZEN",
      vehicleNumber,
      ambulanceType,
      callSign,
      baseStation,
      vehicleModel,
      equipmentLevel,
      equipmentList,
      hospitalName,
      hospitalRegistrationNumber,
      address,
      pincode,
      latitude,
      longitude,
      totalBeds,
      handledSeverities,
    } = body;

    // Validate standard inputs
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter your full name or entity name." },
        { status: 400 }
      );
    }

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!phone || !validatePhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number (digits only)." },
        { status: 400 }
      );
    }

    const passValidation = validatePassword(password || "");
    if (!passValidation.valid) {
      return NextResponse.json(
        { error: passValidation.message || "Invalid password." },
        { status: 400 }
      );
    }

    // Role-specific validation
    const userRole: UserRole =
      role === "AMBULANCE" || role === "HOSPITAL" ? role : "CITIZEN";

    if (userRole === "AMBULANCE") {
      if (!vehicleNumber || typeof vehicleNumber !== "string" || vehicleNumber.trim().length === 0) {
        return NextResponse.json(
          { error: "Please provide your vehicle registration number (e.g. KL-07-DR-8421)." },
          { status: 400 }
        );
      }
    }

    if (userRole === "HOSPITAL") {
      if (!hospitalName || typeof hospitalName !== "string" || hospitalName.trim().length === 0) {
        return NextResponse.json(
          { error: "Please provide the official hospital name." },
          { status: 400 }
        );
      }
      if (!address || typeof address !== "string" || address.trim().length === 0) {
        return NextResponse.json(
          { error: "Please provide the hospital address/location." },
          { status: 400 }
        );
      }
    }

    // Create user in database
    const user = await createUser({
      name: userRole === "HOSPITAL" ? (hospitalName || name).trim() : name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role: userRole,
    });

    // If registering as Ambulance, register unit
    if (userRole === "AMBULANCE") {
      try {
        await createAmbulance({
          vehicleNumber: (vehicleNumber || "AMB-UNIT").trim().toUpperCase(),
          driverId: user.id,
          driverName: user.name,
          driverPhone: user.phone || phone,
          type: ambulanceType || "TYPE_C",
          equipmentLevel: equipmentLevel || ambulanceType || "TYPE_C",
          equipmentList: Array.isArray(equipmentList) ? equipmentList : [],
          callSign: callSign ? callSign.trim() : undefined,
          baseStation: baseStation ? baseStation.trim() : undefined,
          vehicleModel: vehicleModel ? vehicleModel.trim() : undefined,
          latitude: latitude || 9.9312,
          longitude: longitude || 76.2673,
        });
      } catch (e) {
        console.warn("[Ambulance Provisioning Notice]", e);
      }
    }

    // If registering as Hospital, register hospital entry
    if (userRole === "HOSPITAL") {
      try {
        await createHospital({
          name: (hospitalName || user.name).trim(),
          code: (hospitalRegistrationNumber || `HOSP-${Math.floor(100 + Math.random() * 900)}`).trim(),
          address: (address || "Emergency Department, Central").trim(),
          latitude: latitude || 9.9312,
          longitude: longitude || 76.2673,
          phone: user.phone || phone,
          availableBeds: Number(totalBeds) || 12,
          handledSeverities:
            Array.isArray(handledSeverities) && handledSeverities.length > 0
              ? handledSeverities
              : ["LOW", "MODERATE", "HIGH", "CRITICAL"],
        });
      } catch (e) {
        console.warn("[Hospital Provisioning Notice]", e);
      }
    }

    const token = await createSessionToken(user);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        user,
        message: `${userRole.charAt(0) + userRole.slice(1).toLowerCase()} account registered successfully.`,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to register account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
