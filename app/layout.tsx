import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SANTÉ+ — Assistant d'information santé",
  description: "Un assistant francophone pour mieux comprendre la santé et la prévention.",
  applicationName: "SANTÉ+",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}