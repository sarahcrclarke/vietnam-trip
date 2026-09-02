import { Geist, Zilla_Slab, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getItinerary } from "@/lib/itinerary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const zillaSlab = Zilla_Slab({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export function generateMetadata() {
  const { title, subtitle } = getItinerary();
  return {
    title,
    description: subtitle,
  };
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${zillaSlab.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
