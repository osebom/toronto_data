/**
 * Server-side logging utility
 * Logs are sent to the server and appear in server terminal, not browser console
 */

/**
 * Log a message to the server (non-blocking, fire-and-forget)
 */
export function logToServer(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
  // Only log in browser environment
  if (typeof window === 'undefined') return;

  // Fire and forget - don't await, don't block UI
  fetch('/api/ai-search/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {
    // Silently fail - logging should never break the app
  });
}

/**
 * Convenience functions
 */
export const serverLog = {
  info: (message: string, data?: Record<string, unknown>) => logToServer('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => logToServer('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => logToServer('error', message, data),
};
