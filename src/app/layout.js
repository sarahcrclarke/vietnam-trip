import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getItinerary } from "@/lib/itinerary";

// Licensed local fonts — next/font/local self-hosts these and correctly
// prefixes their URLs with the site's basePath (unlike a plain CSS @font-face
// referencing /public, which would 404 under the GitHub Pages basePath).
const freight = localFont({
  variable: "--font-freight",
  src: [
    { path: "./fonts/FreightBigPro-Regular.ttf", weight: "300", style: "normal" },
    { path: "./fonts/FreightBigPro-Italic.ttf", weight: "300", style: "italic" },
  ],
});

const quasimoda = localFont({
  variable: "--font-quasimoda",
  src: [
    { path: "./fonts/Quasimoda-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/Quasimoda-ExtraLight.ttf", weight: "200", style: "normal" },
  ],
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
      className={`${freight.variable} ${quasimoda.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
