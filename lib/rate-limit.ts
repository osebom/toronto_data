/**
 * Rate limiting utility for AI chat
 * Allows 4 messages per 2 minutes per user (stored in localStorage)
 */

const RATE_LIMIT_KEY = 'ai_chat_rate_limit';
const MESSAGES_PER_PERIOD = 4;
const PERIOD_IN_MS = 2 * 60 * 1000; // 2 minutes

export interface RateLimitStatus {
  remaining: number;
  resetAt: number;
  canSend: boolean;
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(): RateLimitStatus {
  if (typeof window === 'undefined') {
    return { remaining: MESSAGES_PER_PERIOD, resetAt: Date.now() + PERIOD_IN_MS, canSend: true };
  }

  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) {
      return { remaining: MESSAGES_PER_PERIOD, resetAt: Date.now() + PERIOD_IN_MS, canSend: true };
    }

    const data = JSON.parse(stored);
    const now = Date.now();

    // If the period has passed, reset the limit
    // Also reset if the reset time is more than 2 minutes away (old data from previous version)
    if (now >= data.resetAt || (data.resetAt - now) > PERIOD_IN_MS) {
      return { remaining: MESSAGES_PER_PERIOD, resetAt: now + PERIOD_IN_MS, canSend: true };
    }

    // Return current status
    return {
      remaining: data.remaining,
      resetAt: data.resetAt,
      canSend: data.remaining > 0,
    };
  } catch (error) {
    console.error('Error reading rate limit:', error);
    return { remaining: MESSAGES_PER_PERIOD, resetAt: Date.now() + PERIOD_IN_MS, canSend: true };
  }
}

/**
 * Record a message and update rate limit
 * Returns true if message was allowed, false if rate limit exceeded
 */
export function recordMessage(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const status = getRateLimitStatus();
    
    if (!status.canSend) {
      return false;
    }

    // Decrement remaining count
    const newRemaining = status.remaining - 1;
    const data = {
      remaining: newRemaining,
      resetAt: status.resetAt,
    };

    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error recording message:', error);
    return true; // Allow on error to not break the app
  }
}

/**
 * Get time until rate limit resets (in minutes)
 */
export function getTimeUntilReset(): number {
  const status = getRateLimitStatus();
  const now = Date.now();
  const msUntilReset = status.resetAt - now;
  return Math.ceil(msUntilReset / (60 * 1000)); // Convert to minutes
}

/**
 * Format time until reset as a human-readable string
 */
export function formatTimeUntilReset(): string {
  const minutes = getTimeUntilReset();
  if (minutes <= 0) {
    return 'now';
  }
  if (minutes === 1) {
    return '1 minute';
  }
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

