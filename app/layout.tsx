import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Generador de CVs con IA",
  description: "MVP de portafolio con Next.js 15, IA y generación de PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
