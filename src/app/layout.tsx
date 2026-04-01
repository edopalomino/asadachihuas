import type { Metadata } from "next";
import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asada Chihuas | Pedido rápido por WhatsApp",
  description:
    "Menú digital mobile-first para pedir carne asada, paquetes y extras por WhatsApp en segundos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto border-t border-black/8 bg-white/55 px-4 py-4 text-center text-sm text-stone-600 backdrop-blur-sm">
          Desarrollado por <span className="font-semibold text-stone-900">edolabs</span>
        </footer>
      </body>
    </html>
  );
}
