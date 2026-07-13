import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { buildQuoteRequestEmail } from "@/lib/email-template";
import type { ContactRequestBody } from "@/types/contact";

export async function POST(request: Request) {
  const body = (await request.json()) as ContactRequestBody;
  const { name, email, phone, service, address, message } = body;

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 400 },
    );
  }

  try {
    await resend.emails.send({
      from: `Rabbit Pressure Washing <${process.env.RESEND_FROM_EMAIL}>`,
      to: "jayrx16@gmail.com",
      replyTo: email,
      subject: `Quote Request from ${name}${service ? ` — ${service}` : ""}`,
      html: buildQuoteRequestEmail({ name, email, phone, service, address, message }),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resend error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 },
    );
  }
}
