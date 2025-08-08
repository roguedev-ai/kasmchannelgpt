/**
 * Root Layout Component
 * 
 * This is the main layout wrapper for the entire Next.js application.
 * It sets up:
 * - HTML structure and language
 * - Font configuration (Inter from Google Fonts)
 * - Global styles and CSS
 * - Metadata for SEO
 * 
 * Customization Guide:
 * 1. Font: Change `Inter` to any Google Font or custom font
 * 2. Metadata: Update title and description for your brand
 * 3. Global styles: Modify globals.css for theme customization
 * 4. Add providers here (e.g., theme providers, analytics)
 * 
 * @example
 * // To add a theme provider:
 * import { ThemeProvider } from '@/components/theme-provider'
 * 
 * // Wrap children with:
 * <ThemeProvider>
 *   {children}
 * </ThemeProvider>
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';
import { PWAManager } from '@/components/pwa/PWAManager';
import "./globals.css";

/**
 * Font Configuration
 * 
 * Using Inter as the default font for clean, modern typography.
 * The font is loaded from Google Fonts and optimized by Next.js.
 * 
 * To change the font:
 * 1. Import a different font from 'next/font/google'
 * 2. Update the variable name (used in CSS as var(--font-inter))
 * 3. Update the className in the body tag
 * 
 * @example
 * // Using Roboto instead:
 * import { Roboto } from "next/font/google";
 * const roboto = Roboto({
 *   variable: "--font-roboto",
 *   subsets: ["latin"],
 *   weight: ["400", "500", "700"],
 * });
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/**
 * Page Metadata
 * 
 * SEO and browser metadata for the application.
 * This appears in search results and browser tabs.
 * 
 * Customization:
 * - title: Your application name
 * - description: Brief description for search engines
 * - Add more metadata fields as needed:
 *   - keywords: ["chat", "ai", "customgpt"]
 *   - authors: [{ name: "Your Name" }]
 *   - openGraph: { ... } for social sharing
 *   - twitter: { ... } for Twitter cards
 * 
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export const metadata: Metadata = {
  title: "CustomGPT Chat UI",
  description: "A modern chat interface for CustomGPT.ai's RAG platform",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CustomGPT",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "CustomGPT",
    "application-name": "CustomGPT",
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

/**
 * Root Layout Component
 * 
 * This component wraps all pages in the application.
 * It's the perfect place to add:
 * - Global providers (theme, authentication, etc.)
 * - Analytics scripts
 * - Global error boundaries
 * - Toast notifications
 * - Modal portals
 * 
 * Body Classes:
 * - font-sans: Uses the system sans-serif font stack
 * - antialiased: Improves font rendering
 * - inter.variable: Makes the Inter font available as CSS variable
 * 
 * @param children - Page content to render
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent flash of incorrect theme on page load
              (function() {
                try {
                  const stored = localStorage.getItem('customgpt-config');
                  const config = stored ? JSON.parse(stored) : null;
                  const theme = config?.theme || 'light';
                  document.documentElement.className = theme;
                } catch (e) {
                  // Default to light theme if there's an error
                  document.documentElement.className = 'light';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Add global providers here */}
        {children}
        {/* PWA Manager for install prompts and updates */}
        <PWAManager />
        {/* Global toast notifications with close button */}
        <Toaster 
          position="top-center" 
          closeButton
          richColors
          theme="light"
          gap={8}
          toastOptions={{
            style: {
              marginTop: '8px'
            }
          }}
        />
      </body>
    </html>
  );
}
