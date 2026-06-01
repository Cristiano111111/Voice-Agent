import { NextResponse } from "next/server";
import { createLocalSession, isValidLocalLogin } from "@/lib/local-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isValidLocalLogin(email, password)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createLocalSession();
  return NextResponse.json({ ok: true });
}
