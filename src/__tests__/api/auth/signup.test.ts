/**
 * Tests for /api/auth/signup
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockPrisma, resetAllMocks } from '../../helpers'

// Mock dependencies
vi.mock('@/lib/db', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/rate-limit', () => ({
    authLimiter: {},
    checkRateLimit: vi.fn().mockResolvedValue(null), // Not rate limited
}))

// Import the route handler after mocks
const { POST } = await import('@/app/api/auth/signup/route')

describe('POST /api/auth/signup', () => {
    beforeEach(() => {
        resetAllMocks()
    })

    it('should create a user with valid input', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null) // No existing user
        mockPrisma.plan.findUnique.mockResolvedValue({ id: 'free-plan', credits: 10 })
        mockPrisma.user.create.mockResolvedValue({
            id: 'new-user-id',
            email: 'new@example.com',
            name: 'New User',
            role: 'user',
        })

        const request = new Request('http://localhost:3003/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'new@example.com',
                password: 'securepassword123',
                name: 'New User',
            }),
        }) as any

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.user.email).toBe('new@example.com')
        expect(mockPrisma.user.create).toHaveBeenCalledOnce()
    })

    it('should reject duplicate email', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'dup@example.com' })

        const request = new Request('http://localhost:3003/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'dup@example.com',
                password: 'password123',
            }),
        }) as any

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(409)
        expect(data.error).toContain('already exists')
        expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('should reject invalid email', async () => {
        const request = new Request('http://localhost:3003/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'not-an-email',
                password: 'password123',
            }),
        }) as any

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBeDefined()
    })

    it('should reject short password', async () => {
        const request = new Request('http://localhost:3003/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: '123',
            }),
        }) as any

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('6 characters')
    })
})
