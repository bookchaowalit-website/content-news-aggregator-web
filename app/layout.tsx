import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SITE } from "@/components/news-frame";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const title = "News Desk — a sample reading queue";
const description = "Five authored sample notes, not live news: search, filter by beat, and mark what to read or save in this browser.";

export const metadata: Metadata = {
  title: { default: title, template: "%s — News Desk" },
  description,
  authors: [{ name: "Bookchaowalit", url: "https://bookchaowalit.com" }],
  creator: "Bookchaowalit",
  metadataBase: new URL(SITE),
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: SITE, title, description, siteName: "News Desk" },
  twitter: { card: "summary", title, description },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The font variable sits on <html>: the Reader shell tokens live on :root and read it from there.
  return <html lang="en" className={geistSans.variable}><body>{children}</body></html>;
}
