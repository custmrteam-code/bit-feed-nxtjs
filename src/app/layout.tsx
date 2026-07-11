import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Providers } from "@/providers";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "bitfeed — Clean. Minimal. Insights.",
    template: "%s — bitfeed",
  },
  description:
    "A community-driven news platform by custmr.team. Curated news with a clean, minimal reading experience.",
  openGraph: {
    type: "website",
    siteName: "bitfeed",
    url: SITE_URL,
  },
  icons: { icon: "/assets/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={roboto.variable} data-scroll-behavior="smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
