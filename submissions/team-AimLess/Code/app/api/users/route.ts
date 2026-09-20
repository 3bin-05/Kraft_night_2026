import { NextResponse } from "next/server";
import { getAllUsers, createUser } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/types/auth";
import { validateEmail, validatePhone, validatePassword } from "@/lib/validation";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const users = await getAllUsers();
    return NextResponse.json({ users }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load users.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, password, role } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: "Valid email address is required." }, { status: 400 });
    }

    if (!phone || !validatePhone(phone)) {
      return NextResponse.json({ error: "Valid phone number is required." }, { status: 400 });
    }

    const passCheck = validatePassword(password || "");
    if (!passCheck.valid) {
      return NextResponse.json({ error: passCheck.message || "Invalid password." }, { status: 400 });
    }

    const validRoles: UserRole[] = ["CITIZEN", "AMBULANCE", "HOSPITAL", "ADMIN"];
    const targetRole: UserRole = validRoles.includes(role) ? role : "CITIZEN";

    const newUser = await createUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      role: targetRole,
    });

    return NextResponse.json(
      { user: newUser, message: `Account for ${newUser.name} created as ${newUser.role}.` },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create user account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
