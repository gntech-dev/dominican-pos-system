import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import UnifiedNavigation from "@/components/ui/UnifiedNavigation";
import { RoleProvider } from "@/contexts/RoleContext";
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
  title: "POS Dominicana - Sistema Punto de Venta",
  description: "Sistema de Punto de Venta con cumplimiento DGII para República Dominicana",
  keywords: "POS, punto de venta, dominicana, DGII, NCF, RNC, facturación",
  authors: [{ name: "POS Dominicana Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full bg-neutral-50 font-sans`}
      >
        <RoleProvider>
          <div className="flex min-h-screen">
            <UnifiedNavigation />
            
            {/* Main content area */}
            <main className="flex-1 lg:ml-72">
              <div className="min-h-screen">
                {children}
              </div>
            </main>
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
