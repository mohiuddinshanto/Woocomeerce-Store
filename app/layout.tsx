import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "EPIC. — Modern Premium Store",
  description: "Discover curated everyday essentials, crafted for modern life.",
};

type ThemeSettings = { primaryColor?: string; secondaryColor?: string; font?: string };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let theme: ThemeSettings = {};
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/store/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1_500),
    });
    theme = ((await response.json()).config?.themeSettings ?? {}) as ThemeSettings;
  } catch {
    /* The onboarding page remains usable before the API is available. */
  }

  const style = {
    "--primary": theme.primaryColor ?? "#4f46e5",
    "--primary-hover": "#4338ca",
    "--secondary": theme.secondaryColor ?? "#ffffff",
    "--store-font": theme.font && theme.font !== "Arial" ? theme.font : "'Plus Jakarta Sans', sans-serif",
  } as CSSProperties;

  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={style}>
        <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', background: '#0f172a', color: '#fff' } }} />
        {children}
      </body>
    </html>
  );
}
