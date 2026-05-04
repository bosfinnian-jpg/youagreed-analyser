import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#eeece5",
};

export const metadata: Metadata = {
  title: "trace.ai — your AI data dossier",
  description: "Upload your ChatGPT export and see what your conversations reveal about you. A critical data experience.",
  openGraph: {
    title: "trace.ai — your AI data dossier",
    description: "Upload your ChatGPT export. See what your conversations permanently reveal.",
    url: "https://youagreed.co.uk",
    siteName: "trace.ai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        {children}
      </body>
    </html>
  );
}
