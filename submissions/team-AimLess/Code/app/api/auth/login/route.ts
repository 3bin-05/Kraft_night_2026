import { NextResponse } from "next/server";
import { verifyUserCredentials } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await verifyUserCredentials(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        user,
        message: "Logged in successfully.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected login error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
