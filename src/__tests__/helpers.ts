/**
 * Test utilities and mocks for API route testing.
 */
import { vi } from 'vitest'

// ---- Mock Prisma ----
export const mockPrismaUser = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
}

export const mockPrismaBook = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
}

export const mockPrismaPage = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
}

export const mockPrismaGeneration = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
}

export const mockPrismaTemplate = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    count: vi.fn(),
}

export const mockPrismaPlan = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
}

export const mockPrismaApiKey = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
}

export const mockPrismaUsageRecord = {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
}

export const mockPrisma = {
    user: mockPrismaUser,
    book: mockPrismaBook,
    page: mockPrismaPage,
    generation: mockPrismaGeneration,
    template: mockPrismaTemplate,
    plan: mockPrismaPlan,
    apiKey: mockPrismaApiKey,
    usageRecord: mockPrismaUsageRecord,
}

// ---- Mock Auth Session ----
export function createMockSession(overrides?: {
    id?: string
    email?: string
    name?: string
    role?: string
}) {
    return {
        user: {
            id: overrides?.id ?? 'test-user-id',
            email: overrides?.email ?? 'test@example.com',
            name: overrides?.name ?? 'Test User',
            role: overrides?.role ?? 'user',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
    }
}

export function createAdminSession() {
    return createMockSession({ id: 'admin-user-id', role: 'admin', email: 'admin@example.com' })
}

// ---- Mock NextRequest ----
export function createMockRequest(
    url: string,
    options?: {
        method?: string
        body?: Record<string, unknown>
        headers?: Record<string, string>
    }
) {
    const { method = 'GET', body, headers = {} } = options ?? {}

    return new Request(`http://localhost:3003${url}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    })
}

// ---- Reset all mocks helper ----
export function resetAllMocks() {
    Object.values(mockPrisma).forEach((model) => {
        Object.values(model).forEach((fn) => {
            if (typeof fn === 'function' && 'mockReset' in fn) {
                (fn as ReturnType<typeof vi.fn>).mockReset()
            }
        })
    })
}
