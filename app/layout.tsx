import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Dad Dashboard",
  description: "Your personal dashboard for staying organized and up to date",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress Next.js error overlay for MetaMask/extension errors
              (function() {
                if (typeof window === 'undefined') return;
                
                // Suppress console errors
                const originalError = window.console.error;
                window.console.error = function(...args) {
                  const errorString = args.join(' ');
                  if (
                    errorString.includes('MetaMask') ||
                    errorString.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                    errorString.includes('Failed to connect to MetaMask') ||
                    errorString.includes('ethereum') ||
                    errorString.includes('web3')
                  ) {
                    return;
                  }
                  originalError.apply(window.console, args);
                };

                // Suppress error events
                window.addEventListener('error', function(event) {
                  const errorMessage = event.message || '';
                  const errorSource = event.filename || '';
                  if (
                    errorMessage.includes('MetaMask') ||
                    errorMessage.includes('Failed to connect to MetaMask') ||
                    errorSource.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                    errorMessage.includes('ethereum') ||
                    errorMessage.includes('web3')
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                  }
                }, true);

                // Suppress unhandled rejections
                window.addEventListener('unhandledrejection', function(event) {
                  const reason = event.reason?.toString() || '';
                  if (
                    reason.includes('MetaMask') ||
                    reason.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
                    reason.includes('Failed to connect to MetaMask') ||
                    reason.includes('ethereum') ||
                    reason.includes('web3')
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
