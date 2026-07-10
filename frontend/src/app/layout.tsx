import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
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
  viewportFit: "cover",
  themeColor: "#111827",
};

export const metadata: Metadata = {
  title: {
    default: "PV HealthyLiving - Calculator & Portfolio",
    template: "%s | PV HealthyLiving",
  },
  description: "Business management application for PV calculation and portfolio management. Track products, manage portfolios, and calculate totals with ease.",
  keywords: ["PV calculator", "portfolio management", "business tools", "product tracking"],
  authors: [{ name: "PV HealthyLiving" }],
  creator: "PV HealthyLiving",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pv-healthyliving.vercel.app",
    siteName: "PV HealthyLiving",
    title: "PV HealthyLiving - Calculator & Portfolio",
    description: "Business management application for PV calculation and portfolio management.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PV HealthyLiving",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PV HealthyLiving - Calculator & Portfolio",
    description: "Business management application for PV calculation and portfolio management.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
