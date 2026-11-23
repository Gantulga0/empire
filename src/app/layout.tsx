import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Mongolian Cyrillic needs Ө/ө (U+04E8) and Ү/ү (U+04AE), which live in the cyrillic-ext subset.
const display = Cormorant_Garamond({
  variable: "--font-display-face",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans-face",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Empire's Shadow — Японы Хятад дахь нөлөө ба түрэмгийлэл (1894–1945)",
  description:
    "Японы Хятад дахь нөлөө ба түрэмгийллийг (1894–1945) газрын зургаар тайлбарласан интерактив түүхэн атлас.",
};

export const viewport: Viewport = {
  themeColor: "#080E17",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn" className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
