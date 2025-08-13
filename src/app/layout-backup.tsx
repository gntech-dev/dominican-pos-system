import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavigationBusiness from "@/components/ui/Navigation-Business";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        <RoleProvider>
          <NavigationBusiness />
          <main className="flex-1">
            {children}
          </main>
        </RoleProvider>
      </body>
    </html>
  );
}
