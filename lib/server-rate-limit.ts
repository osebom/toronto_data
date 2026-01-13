/**
 * Server-side rate limiting for AI search API
 * Uses in-memory storage (Map) to track requests per IP address
 * 
 * For production with multiple server instances, consider using:
 * - Redis for distributed rate limiting
 * - A dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store: IP address -> RateLimitEntry
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration (can be moved to environment variables)
const RATE_LIMIT_REQUESTS = parseInt(process.env.AI_SEARCH_RATE_LIMIT || '4', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.AI_SEARCH_RATE_LIMIT_WINDOW_MS || '120000', 10); // 2 minutes default

/**
 * Get client identifier from request
 * In production, you might want to use:
 * - IP address from headers (x-forwarded-for, x-real-ip)
 * - User ID from authentication token
 * - Session ID
 */
function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  // Use the first IP in the chain if x-forwarded-for exists
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown';
  
  return ip;
}

/**
 * Clean up expired entries from the store
 * This prevents memory leaks in long-running processes
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 * Returns null if allowed, or rate limit info if exceeded
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number; // seconds until reset
}

export function checkRateLimit(request: Request): RateLimitResult {
  // Clean up expired entries periodically (every 100th request to avoid overhead)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  const clientId = getClientIdentifier(request);
  console.log('[Rate Limit] Checking rate limit for client:', clientId);
  const now = Date.now();
  
  const entry = rateLimitStore.get(clientId);
  
  // No entry or expired entry - allow request
  if (!entry || now >= entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(clientId, newEntry);
    console.log('[Rate Limit] New entry created for client:', clientId, {
      count: newEntry.count,
      resetAt: new Date(newEntry.resetAt).toISOString(),
    });
    
    return {
      allowed: true,
      remaining: RATE_LIMIT_REQUESTS - 1,
      resetAt: newEntry.resetAt,
    };
  }
  
  // Entry exists and is within window
  if (entry.count >= RATE_LIMIT_REQUESTS) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    console.warn('[Rate Limit] Rate limit exceeded for client:', clientId, {
      count: entry.count,
      limit: RATE_LIMIT_REQUESTS,
      resetAt: new Date(entry.resetAt).toISOString(),
      retryAfter,
    });
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }
  
  // Increment count
  entry.count += 1;
  rateLimitStore.set(clientId, entry);
  console.log('[Rate Limit] Request allowed for client:', clientId, {
    count: entry.count,
    remaining: RATE_LIMIT_REQUESTS - entry.count,
    resetAt: new Date(entry.resetAt).toISOString(),
  });
  
  return {
    allowed: true,
    remaining: RATE_LIMIT_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get rate limit status without incrementing (for checking only)
 */
export function getRateLimitStatus(request: Request): RateLimitResult {
  const clientId = getClientIdentifier(request);
  const now = Date.now();
  
  const entry = rateLimitStore.get(clientId);
  
  if (!entry || now >= entry.resetAt) {
    return {
      allowed: true,
      remaining: RATE_LIMIT_REQUESTS,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
  }
  
  const remaining = Math.max(0, RATE_LIMIT_REQUESTS - entry.count);
  const retryAfter = remaining === 0 ? Math.ceil((entry.resetAt - now) / 1000) : undefined;
  
  return {
    allowed: remaining > 0,
    remaining,
    resetAt: entry.resetAt,
    retryAfter,
  };
}

/**
 * Format rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetTimestamp = Math.floor(result.resetAt / 1000);
  
  return {
    'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': resetTimestamp.toString(),
    ...(result.retryAfter && {
      'Retry-After': result.retryAfter.toString(),
    }),
  };
}
