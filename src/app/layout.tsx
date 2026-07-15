import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Loaded alongside Geist so Arabic company/contact names render with
// proper glyphs anywhere in the UI — the browser falls back to this
// font automatically for Arabic codepoints via the --font-sans stack.
const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
});

// Brand wordmark font ("Saudi Panther") — used only for the logo/brand
// name, not body copy, matching the elegant serif in the brand identity.
const playfairDisplay = Playfair_Display({
  variable: "--font-brand-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saudi Panther | Advertising Operations",
  description: "Advertisement operations & financial management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
