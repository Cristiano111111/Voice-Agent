import type { ContactRequestBody } from "@/types/contact";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildQuoteRequestEmail(fields: ContactRequestBody) {
  const { name, email, phone, service, address, message } = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      typeof value === "string" ? escapeHtml(value) : value,
    ]),
  ) as ContactRequestBody;

  return `
    <div style="font-family:sans-serif;max-width:560px;color:#111">
      <h2 style="margin:0 0 1.5rem;font-size:1.4rem">New Quote Request</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:0.5rem 0;color:#666;width:90px">Name</td><td style="padding:0.5rem 0;font-weight:600">${name}</td></tr>
        <tr><td style="padding:0.5rem 0;color:#666">Email</td><td style="padding:0.5rem 0"><a href="mailto:${email}">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding:0.5rem 0;color:#666">Phone</td><td style="padding:0.5rem 0"><a href="tel:${phone}">${phone}</a></td></tr>` : ""}
        ${service ? `<tr><td style="padding:0.5rem 0;color:#666">Service</td><td style="padding:0.5rem 0">${service}</td></tr>` : ""}
        ${address ? `<tr><td style="padding:0.5rem 0;color:#666">Address</td><td style="padding:0.5rem 0">${address}</td></tr>` : ""}
      </table>
      ${message ? `<div style="margin-top:1.5rem;padding:1rem;background:#f5f5f5;border-radius:4px;white-space:pre-wrap;font-size:0.9rem">${message}</div>` : ""}
      <p style="margin-top:2rem;font-size:0.8rem;color:#999">Sent from jayrx.net contact form</p>
    </div>
  `;
}
