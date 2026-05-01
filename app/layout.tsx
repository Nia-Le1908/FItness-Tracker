import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore: Next.js handles global CSS imports.
import "./globals.css";
import { SiteNav } from "@/components/site-nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "FitBudget",
  description: "A mobile-first nutrition and progress tracking app for budget-conscious fitness goals."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable + " dark"} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}