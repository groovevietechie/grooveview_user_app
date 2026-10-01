import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NavigationHandler from "@/components/NavigationHandler";
import MobileBackHandler from "@/components/MobileBackHandler";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAServiceWorkerRegister from "@/components/PWAServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GrooveVie - Order Food",
  description: "Scan QR codes to order food from your favorite restaurants",
  viewport: "width=device-width, initial-scale=1, user-scalable=no",
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "GrooveVie"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <PWAServiceWorkerRegister />
          <Suspense fallback={null}>
            <NavigationHandler />
            <MobileBackHandler />
            <PWAInstallPrompt />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
