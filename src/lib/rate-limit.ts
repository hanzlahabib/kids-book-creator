/**
 * In-memory rate limiter for API routes.
 * 
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 })
 *   const { success } = await limiter.check(10, identifier) // 10 requests per interval
 */

interface RateLimitConfig {
    /** Time window in milliseconds */
    interval: number
    /** Max number of unique tokens to track (prevents memory leak) */
    uniqueTokenPerInterval: number
}

interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    reset: number
}

export function rateLimit(config: RateLimitConfig) {
    const tokenCache = new Map<string, { count: number; resetTime: number }>()

    // Periodically clean up expired entries
    const cleanup = () => {
        const now = Date.now()
        for (const [key, value] of tokenCache.entries()) {
            if (now > value.resetTime) {
                tokenCache.delete(key)
            }
        }
    }

    // Run cleanup every interval
    if (typeof setInterval !== 'undefined') {
        setInterval(cleanup, config.interval)
    }

    return {
        check: async (limit: number, token: string): Promise<RateLimitResult> => {
            const now = Date.now()
            const entry = tokenCache.get(token)

            if (!entry || now > entry.resetTime) {
                // New window or expired — check if we've hit the unique token cap
                if (tokenCache.size >= config.uniqueTokenPerInterval) {
                    cleanup()
                }

                const resetTime = now + config.interval
                tokenCache.set(token, { count: 1, resetTime })
                return { success: true, limit, remaining: limit - 1, reset: resetTime }
            }

            entry.count++

            if (entry.count > limit) {
                return { success: false, limit, remaining: 0, reset: entry.resetTime }
            }

            return { success: true, limit, remaining: limit - entry.count, reset: entry.resetTime }
        },
    }
}

// Pre-configured limiters for different endpoints
export const generateLimiter = rateLimit({
    interval: 60_000,          // 1 minute window
    uniqueTokenPerInterval: 500,
})

export const authLimiter = rateLimit({
    interval: 60_000,          // 1 minute window
    uniqueTokenPerInterval: 500,
})

export const exportLimiter = rateLimit({
    interval: 60_000,          // 1 minute window
    uniqueTokenPerInterval: 500,
})

/**
 * Helper to get a rate limit response for API routes.
 * Returns a Response object with 429 status if rate limited, or null if OK.
 */
export async function checkRateLimit(
    limiter: ReturnType<typeof rateLimit>,
    maxRequests: number,
    identifier: string,
): Promise<Response | null> {
    const result = await limiter.check(maxRequests, identifier)

    if (!result.success) {
        return new Response(
            JSON.stringify({
                error: 'Too many requests',
                message: `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`,
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': String(result.limit),
                    'X-RateLimit-Remaining': String(result.remaining),
                    'X-RateLimit-Reset': String(result.reset),
                    'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
                },
            },
        )
    }

    return null
}
