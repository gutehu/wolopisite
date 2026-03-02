import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Wolopi — Performance par IA | VBT, Mobilité, Force-Vitesse",
  description:
    "Votre smartphone est votre laboratoire de performance. Analyse de vélocité, tests de mobilité et profils force-vitesse avec l'intelligence artificielle.",
  keywords: ["biomécanique", "VBT", "velocity based training", "mobilité", "force-vitesse", "sport", "IA"],
  openGraph: {
    title: "Wolopi — Performance par IA",
    description: "Analyse performance par IA : vélocité, mobilité, sauts.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
