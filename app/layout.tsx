import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
// @ts-ignore: Next.js handles global CSS imports.
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { BottomNav } from "@/components/bottom-nav";
import { LanguageProvider } from "@/lib/i18n";
import { ObservabilityProvider } from "@/components/observability-provider";
import { FeedbackProvider } from "@/lib/ui-feedback";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "FitBudget",
  description: "Ứng dụng theo dõi dinh dưỡng và tiến độ cho mục tiêu fitness tiết kiệm / A mobile-first nutrition and progress tracking app for budget-conscious fitness goals."
};

export const viewport: Viewport = {
  themeColor: "#0a0710"
};

const themeInit = `
(function() {
  try {
    var VALID_THEMES = ['midnight', 'light', 'forest', 'sunset', 'ocean', 'rose'];
    var stored = window.localStorage.getItem('fitbudget-theme');
    var theme = 'midnight';
    if (stored && VALID_THEMES.indexOf(stored) !== -1) {
      theme = stored;
    } else if (stored === 'dark') {
      theme = 'midnight';
    } else if (stored !== 'light' && stored !== 'midnight' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      theme = 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="bg-background text-foreground antialiased pb-16 md:pb-0">
        <LanguageProvider>
          <FeedbackProvider>
            <ObservabilityProvider />
            <SiteNav />
            {children}
            <BottomNav />
          </FeedbackProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
