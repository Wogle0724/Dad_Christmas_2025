'use client';

import { useEffect } from 'react';
import React from 'react';

// Suppress MetaMask and browser extension errors globally
if (typeof window !== 'undefined') {
  // Suppress console errors
  const originalError = console.error;
  console.error = (...args: any[]) => {
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
    originalError.apply(console, args);
  };

  // Suppress unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
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
    }
  });

  // Suppress Next.js error overlay for MetaMask errors
  window.addEventListener('error', (event) => {
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
    }
  }, true);
}

// React Error Boundary class component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Check if it's a MetaMask/extension error
    const errorString = error.toString();
    if (
      errorString.includes('MetaMask') ||
      errorString.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
      errorString.includes('Failed to connect to MetaMask') ||
      errorString.includes('ethereum') ||
      errorString.includes('web3')
    ) {
      // Don't show error UI for extension errors
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorString = error.toString();
    if (
      errorString.includes('MetaMask') ||
      errorString.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
      errorString.includes('Failed to connect to MetaMask') ||
      errorString.includes('ethereum') ||
      errorString.includes('web3')
    ) {
      // Silently ignore extension errors
      return;
    }
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-4">
          <h1>Something went wrong.</h1>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Additional suppression for Next.js dev overlay
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // Try to intercept Next.js error overlay
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = function(event: Event) {
        if (event.type === 'error' || event.type === 'unhandledrejection') {
          const errorEvent = event as ErrorEvent | CustomEvent;
          const errorMessage = (errorEvent as any).message || (errorEvent as any).reason?.toString() || '';
          if (
            errorMessage.includes('MetaMask') ||
            errorMessage.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
            errorMessage.includes('Failed to connect to MetaMask') ||
            errorMessage.includes('ethereum') ||
            errorMessage.includes('web3')
          ) {
            return false; // Prevent event propagation
          }
        }
        return originalDispatchEvent.call(window, event);
      };
    }
  }, []);

  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
}

