import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "App RH — Formation & Quiz",
  description: "Quiz de montée en compétences RH — Code du travail & CC 0086",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-1 ml-56 p-8 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}
