import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "MinuteXMinute — Practice Plans for Lacrosse Coaches",
  description:
    "Build, run, and share lacrosse practice sessions in minutes. Time-aware drill sequencing for coaches who run a tight practice.",
  openGraph: {
    title: "MinuteXMinute — Practice Plans for Lacrosse Coaches",
    description:
      "Build, run, and share lacrosse practice sessions in minutes. Time-aware drill sequencing for coaches who run a tight practice.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-180x180.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
