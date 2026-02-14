/**
 * Tests for /api/stats
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockPrisma, resetAllMocks, createMockSession } from '../../helpers'

// Mock dependencies
vi.mock('@/lib/db', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue(createMockSession()),
}))

const { GET } = await import('@/app/api/stats/route')

describe('GET /api/stats', () => {
    beforeEach(() => {
        resetAllMocks()
    })

    it('should return dashboard statistics', async () => {
        mockPrisma.book.count.mockResolvedValue(5)
        mockPrisma.page.count.mockResolvedValue(45)
        mockPrisma.generation.count.mockResolvedValue(60)
        mockPrisma.book.findMany.mockResolvedValue([
            { id: 'b1', title: 'Book 1', status: 'exported' },
        ])

        const request = new Request('http://localhost:3003/api/stats') as any
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('stats')
        expect(data.stats).toHaveProperty('totalBooks')
        expect(data.stats).toHaveProperty('totalPages')
        expect(data.stats).toHaveProperty('totalGenerations')
    })
})
