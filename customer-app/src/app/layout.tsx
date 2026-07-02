import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Genie Farm",
  description: "Fresh fruits & vegetables delivered daily",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/favicon-96x96.png?v=2", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                const sendLog = async (logData) => {
                  try {
                    await window.fetch(window.location.origin + '/api/db', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'log', data: logData })
                    });
                  } catch (e) {}
                };

                const isExtensionError = (message, source, stack) => {
                  const msg = String(message || '');
                  const src = String(source || '');
                  const stk = String(stack || '');
                  return (
                    src.indexOf('chrome-extension://') !== -1 ||
                    stk.indexOf('chrome-extension://') !== -1 ||
                    msg.indexOf('chrome-extension://') !== -1 ||
                    msg.indexOf('MetaMask') !== -1 ||
                    msg.indexOf('metamask') !== -1
                  );
                };

                window.onerror = function (message, source, lineno, colno, error) {
                  const stack = error ? String(error.stack) : '';
                  if (isExtensionError(message, source, stack)) {
                    return true; // Suppress the default error handling & overlay
                  }
                  sendLog({
                    type: 'error',
                    message: String(message),
                    source: String(source),
                    lineno: lineno,
                    colno: colno,
                    stack: stack
                  });
                };

                window.onunhandledrejection = function (event) {
                  const reason = event.reason;
                  const message = reason ? String(reason.message || reason) : 'Promise rejected';
                  const stack = reason && reason.stack ? String(reason.stack) : '';
                  if (isExtensionError(message, '', stack)) {
                    event.preventDefault(); // Suppress unhandled promise rejection default behavior
                    return;
                  }
                  sendLog({
                    type: 'unhandledrejection',
                    message: message,
                    stack: stack
                  });
                };
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0NNV2XPNB4"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-0NNV2XPNB4');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
