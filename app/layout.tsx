import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dominique = localFont({
  src: "../public/fonts/Dominique-VF.ttf",
  variable: "--font-dominique",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Antibroadcasting Inc. — Minneapolis Screen Printing",
    template: "%s | Antibroadcasting Inc.",
  },
  description:
    "Artist-run screen printing shop in Minneapolis. Quality prints for bands, artists, and events. 50pc minimums, 7–10 day turnaround.",
  metadataBase: new URL("https://antibroadcasting.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dominique.variable} antialiased`}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
