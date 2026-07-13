import type { Metadata, Viewport } from "next";
import { Big_Shoulders, DM_Sans } from "next/font/google";
import "./globals.css";
import { MotionConfigProvider } from "@/components/providers/MotionConfigProvider";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { CursorGlow } from "@/components/ui/CursorGlow";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const display = Big_Shoulders({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Rabbit Pressure Washing | Rockville & Clarksburg, MD",
  description:
    "Fast, clean, thorough pressure washing for driveways, siding, decks, and more. Serving Clarksburg, Rockville, and Montgomery County, MD. Free flat-rate quotes.",
};

export const viewport: Viewport = {
  themeColor: "#131A13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} font-body bg-stone text-charcoal`}
      >
        <LoadingScreen />
        <MotionConfigProvider>
          <SmoothScrollProvider>
            <CursorGlow />
            <Nav />
            {children}
            <Footer />
          </SmoothScrollProvider>
        </MotionConfigProvider>
      </body>
    </html>
  );
}
