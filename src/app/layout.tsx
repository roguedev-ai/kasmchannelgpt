import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';
import { PostHogProvider } from '@/components/PostHogProvider';
import { GoogleAnalytics, GTMNoScript } from '@/components/GoogleAnalytics';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Partner Chat",
  description: "A modern chat interface with partner authentication",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Partner Chat",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Partner Chat",
    "application-name": "Partner Chat",
    "msapplication-TileColor": "#6366f1",
    "msapplication-tap-highlight": "no",
    "theme-color": "#6366f1",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <noscript>
          <GTMNoScript />
        </noscript>
        <PostHogProvider>
          {children}
          <Toaster 
            position="top-center" 
            closeButton
            richColors
            gap={8}
            toastOptions={{
              style: {
                marginTop: '8px'
              }
            }}
          />
        </PostHogProvider>
      </body>
    </html>
  );
}
