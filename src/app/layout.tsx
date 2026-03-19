import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { template: "%s - Plenobras", default: "Plenobras" },
  description: "Plataforma de Gestão de Fretes - Plenobras",
  icons: {
    icon: "/assets/images/favicon/favicon-32x32.png",
    apple: "/assets/images/favicon/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <html
    lang="pt-BR"
    className={`${plusJakartaSans.variable} h-full antialiased`}
  >
    <body className="min-h-full flex flex-col">{children}</body>
  </html>
}