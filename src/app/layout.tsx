import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Absolute base so OG/Twitter image URLs resolve correctly. Set NEXT_PUBLIC_SITE_URL
  // at build time in production; falls back to localhost for local dev.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3737"),
  title: "Konglomerat — Permainan Properti & Ekonomi",
  description: "Bangun imperium properti & ekonomi di Kota Raya. Permainan papan strategi ekonomi 2-8 pemain (human & AI), dibangun dengan Next.js + TypeScript.",
  keywords: ["Konglomerat", "board game", "permainan papan", "strategi ekonomi", "properti", "Next.js", "TypeScript", "React"],
  openGraph: {
    title: "Konglomerat",
    description: "Bangun imperium properti & ekonomi di Kota Raya — 2-8 pemain, mix human & AI.",
    siteName: "Konglomerat",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Konglomerat" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Konglomerat",
    description: "Bangun imperium properti & ekonomi di Kota Raya — 2-8 pemain, mix human & AI.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
