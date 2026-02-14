/**
 * Tests for /api/books
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockPrisma, resetAllMocks, createMockSession } from '../../helpers'

// Mock dependencies
vi.mock('@/lib/db', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue(createMockSession()),
}))

const { GET, POST } = await import('@/app/api/books/route')

describe('GET /api/books', () => {
    beforeEach(() => {
        resetAllMocks()
    })

    it('should return user books', async () => {
        const mockBooks = [
            { id: 'book-1', title: 'Animal Coloring', theme: 'animals', status: 'draft', pageCount: 10, _count: { pages: 10 } },
            { id: 'book-2', title: 'Alphabet Tracing', theme: 'letters', status: 'ready', pageCount: 26, _count: { pages: 26 } },
        ]
        mockPrisma.book.findMany.mockResolvedValue(mockBooks)

        const request = new Request('http://localhost:3003/api/books') as any
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.books).toHaveLength(2)
        expect(data.books[0].title).toBe('Animal Coloring')
    })
})

describe('POST /api/books', () => {
    beforeEach(() => {
        resetAllMocks()
    })

    it('should create a new book', async () => {
        mockPrisma.book.create.mockResolvedValue({
            id: 'new-book-id',
            title: 'My Coloring Book',
            theme: 'animals',
            ageGroup: '4-6',
            status: 'draft',
            userId: 'test-user-id',
        })

        const request = new Request('http://localhost:3003/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'My Coloring Book',
                theme: 'animals',
                ageGroup: '4-6',
            }),
        }) as any

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.book.title).toBe('My Coloring Book')
        expect(mockPrisma.book.create).toHaveBeenCalledOnce()
    })

    it('should reject book without title', async () => {
        const request = new Request('http://localhost:3003/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                theme: 'animals',
            }),
        }) as any

        const response = await POST(request)
        expect(response.status).toBe(400)
    })
})
