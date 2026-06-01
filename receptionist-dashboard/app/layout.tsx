import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receptionist Dashboard",
  description: "Client dashboard for AI receptionist call performance."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
