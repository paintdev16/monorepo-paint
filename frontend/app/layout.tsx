import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paint — tu espacio para crear",
  description: "Un espacio para tus próximas ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
