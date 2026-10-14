'use client';

import { useEffect } from 'react';

/**
 * Console Suppressor
 * Suppresses expected non-critical errors from the browser console
 * to keep the console clean during development
 */
export function ConsoleSuppressor() {
  useEffect(() => {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console.error to suppress WebSocket connection errors
    console.error = function(...args: any[]) {
      const errorMsg = args[0]?.toString() || '';
      const errorStr = args.toString();

      // Suppress WebSocket connection failures (expected when using mock API)
      if (
        errorMsg.includes('WebSocket connection') ||
        errorMsg.includes('socket.io') ||
        errorStr.includes('WebSocket connection to') ||
        (typeof Error !== 'undefined' && args[0] instanceof Error && args[0].message?.includes('WebSocket'))
      ) {
        return; // Silently ignore
      }

      // Call original console.error for other messages
      originalError.apply(console, args);
    };

    // Override console.warn to suppress deprecation warnings
    console.warn = function(...args: any[]) {
      const warnMsg = args[0]?.toString() || '';

      // Suppress apple-mobile-web-app-capable deprecation warning
      if (warnMsg.includes('apple-mobile-web-app-capable')) {
        return;
      }

      // Suppress non-static position scroll offset warning (from framer-motion/radix)
      if (warnMsg.includes('non-static position') || warnMsg.includes('scroll offset')) {
        return;
      }

      // Suppress PWA beforeinstallpromptevent banner warnings
      if (
        warnMsg.includes('beforeinstallpromptevent.preventDefault') ||
        warnMsg.includes('Banner not shown') ||
        warnMsg.includes('beforeinstallprompt')
      ) {
        return;
      }

      // Call original console.warn for other messages
      originalWarn.apply(console, args);
    };

    const originalInfo = console.info;
    console.info = function(...args: any[]) {
      const msg = args[0]?.toString() || '';
      if (
        msg.includes('beforeinstallpromptevent.preventDefault') ||
        msg.includes('Banner not shown') ||
        msg.includes('beforeinstallprompt')
      ) {
        return;
      }
      originalInfo.apply(console, args);
    };

    // Cleanup on unmount (restore original methods)
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, []);

  return null;
}
