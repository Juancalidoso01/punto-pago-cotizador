import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Cotizador Punto Pago",
  description:
    "Herramienta interna para cotizar soluciones de cobro a clientes prospectos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={mulish.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
