import type { Metadata } from "next";
import { Nunito, Quicksand } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Planificador Pedagógico 2027 | Escuela Popular El Topo",
  description:
    "Calendario interactivo, cronograma de hitos y matriz de jornadas pedagógicas 2027 del colectivo comunitario Escuela Popular El Topo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${nunito.variable} ${quicksand.variable}`}>
      <body className="min-h-screen bg-canvas text-topo-dark font-sans antialiased selection:bg-topo-mustard/40">
        {children}
      </body>
    </html>
  );
}
