import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WikiFlow — Pengetahuan tim, terus bergerak",
  description: "Internal knowledge base modern untuk dokumentasi teknis tim Scrum.",
  openGraph: {
    title: "WikiFlow Internal Knowledge Base",
    description: "Simpan, cari, dan bagikan pengetahuan teknis tim dalam satu tempat.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1.0,
};

const themeScript = `(() => {
  try {
    const saved = localStorage.getItem("wikiflow-theme") || "system";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = saved === "dark" || (saved === "system" && media.matches);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document.documentElement.dataset.themePreference = saved;

    media.addEventListener("change", (e) => {
      const currentPref = localStorage.getItem("wikiflow-theme") || "system";
      if (currentPref === "system") {
        document.documentElement.dataset.theme = e.matches ? "dark" : "light";
      }
    });
  } catch (err) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}