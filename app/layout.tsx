import type { Metadata, Viewport } from "next";
import { EB_Garamond, Courier_Prime } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f5f4f0",
};

export const metadata: Metadata = {
  title: "trace.ai — your AI data dossier",
  description:
    "Upload your ChatGPT export and see what your conversations permanently reveal about you. A critical data experience.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "trace.ai — your AI data dossier",
    description:
      "Upload your ChatGPT export. See what your conversations permanently reveal.",
    url: "https://youagreed.co.uk",
    siteName: "trace.ai",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "trace.ai — your AI data dossier",
    description: "Upload your ChatGPT export. See what your conversations permanently reveal.",
  },
  robots: {
    index: true,
    follow: true,
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
        className={`${ebGaramond.variable} ${courierPrime.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
