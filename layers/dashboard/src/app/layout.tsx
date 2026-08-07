import type { Metadata, Viewport } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "@/i18n/locale";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const viewport: Viewport = {
  themeColor: "#0C0C0C",
};

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_TITLE || "Exnoria CX Intelligence",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Exnoria CX Intelligence Engine Dashboard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;

  const themeInitScript = `(function(){try{var s=localStorage.getItem("xnoria-theme");var t=s==="light"||s==="dark"?s:(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");var c=document.documentElement.classList;c.add(t==="light"?"light":"dark");}catch(e){document.documentElement.classList.add("dark");}})();`;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} font-sans bg-[var(--background)] text-[var(--foreground)] font-[var(--font-body)]`}
      >
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
