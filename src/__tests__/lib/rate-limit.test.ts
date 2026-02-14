/**
 * Tests for rate limiting utility
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, checkRateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
    it('should allow requests under the limit', async () => {
        const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 100 })

        const result1 = await limiter.check(5, 'user-1')
        expect(result1.success).toBe(true)
        expect(result1.remaining).toBe(4)

        const result2 = await limiter.check(5, 'user-1')
        expect(result2.success).toBe(true)
        expect(result2.remaining).toBe(3)
    })

    it('should block requests over the limit', async () => {
        const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 100 })

        // Hit the limit (3 requests max)
        await limiter.check(3, 'user-2')
        await limiter.check(3, 'user-2')
        await limiter.check(3, 'user-2')

        const result = await limiter.check(3, 'user-2')
        expect(result.success).toBe(false)
        expect(result.remaining).toBe(0)
    })

    it('should track different users independently', async () => {
        const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 100 })

        // User A hits limit
        await limiter.check(1, 'user-a')
        const resultA = await limiter.check(1, 'user-a')
        expect(resultA.success).toBe(false)

        // User B should still be allowed
        const resultB = await limiter.check(1, 'user-b')
        expect(resultB.success).toBe(true)
    })
})

describe('checkRateLimit', () => {
    it('should return null when under limit', async () => {
        const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 100 })
        const response = await checkRateLimit(limiter, 10, 'test-user')
        expect(response).toBeNull()
    })

    it('should return 429 Response when over limit', async () => {
        const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 100 })

        // Exhaust the limit
        for (let i = 0; i < 3; i++) {
            await limiter.check(3, 'limited-user')
        }

        const response = await checkRateLimit(limiter, 3, 'limited-user')
        expect(response).not.toBeNull()
        expect(response!.status).toBe(429)

        const data = await response!.json()
        expect(data.error).toBe('Too many requests')
    })
})
