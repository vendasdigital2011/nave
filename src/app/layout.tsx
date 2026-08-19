import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NaveProspect - Navetech Telecom",
  description: "NaveProspect - CRM Comercial e Migração de Planos da Navetech Telecom",
  icons: {
    icon: "/images/brand/favicon.png",
    shortcut: "/images/brand/favicon.png",
    apple: "/images/brand/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/images/brand/favicon.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
