import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SANTÉ+ — Base de connaissances santé",
  description: "Assistant francophone avec 140 réponses pédagogiques sur les analyses biomédicales et la santé.",
  applicationName: "SANTÉ+",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png", apple: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}