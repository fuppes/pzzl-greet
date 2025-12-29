import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "Greetings - Interaktive Party-Spiele",
  description: "Spiele interaktive Party-Spiele und Quiz mit Freunden. Silvester, Geburtstage und Events noch unterhaltsamer gestalten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
