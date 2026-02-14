/**
 * Shared Zod validation schemas for API routes.
 */
import { z } from 'zod'

// ---- Common ----
export const idParamSchema = z.object({
    id: z.string().min(1, 'ID is required'),
})

export const paginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
})

// ---- Books ----
export const createBookSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    theme: z.string().min(1, 'Theme is required'),
    ageGroup: z.string().optional(),
    description: z.string().max(1000).optional(),
})

export const updateBookSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    theme: z.string().min(1).optional(),
    ageGroup: z.string().optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(['draft', 'ready', 'exported']).optional(),
})

// ---- Pages ----
export const updatePageSchema = z.object({
    pageNumber: z.number().int().min(1).optional(),
    imagePath: z.string().min(1).optional(),
})

export const reorderPagesSchema = z.object({
    pages: z.array(z.object({
        id: z.string().min(1),
        pageNumber: z.number().int().min(1),
    })).min(1, 'At least one page required'),
})

// ---- Generate ----
export const generateSchema = z.object({
    theme: z.string().min(1, 'Theme is required'),
    subject: z.string().max(500).optional(),
    ageGroup: z.string().min(1, 'Age group is required'),
    quantity: z.number().int().min(1).max(100).default(1),
    style: z.enum(['coloring', 'tracing', 'educational', 'drawing']).default('coloring'),
    provider: z.string().default('openai'),
    mode: z.enum(['credits', 'byok']).default('credits'),
})

// ---- Export ----
export const exportSchema = z.object({
    bookId: z.string().min(1, 'Book ID is required'),
    trimSize: z.enum(['8.5x11', '8x10', '6x9']).default('8.5x11'),
    includePageNumbers: z.boolean().default(true),
    includeCover: z.boolean().default(true),
    coverTitle: z.string().max(200).optional(),
    coverAuthor: z.string().max(100).default('Activity Books'),
    coverBackText: z.string().max(500).optional(),
})

// ---- API Keys (BYOK) ----
export const createApiKeySchema = z.object({
    provider: z.enum(['openai', 'replicate', 'stability', 'fal']),
    key: z.string().min(1, 'API key is required').max(500),
    label: z.string().max(100).optional(),
})

// ---- Subscription ----
export const checkoutSchema = z.object({
    planSlug: z.string().min(1, 'Plan slug is required'),
})

// ---- Admin ----
export const adminUpdateUserSchema = z.object({
    role: z.enum(['user', 'admin']).optional(),
    credits: z.number().int().min(0).optional(),
    planId: z.string().optional(),
})

// ---- Helper ----
/**
 * Validate request body and return parsed data or error Response.
 */
export async function validateBody<T>(
    request: Request,
    schema: z.ZodSchema<T>,
): Promise<{ data: T; error?: never } | { data?: never; error: Response }> {
    try {
        const body = await request.json()
        const result = schema.safeParse(body)

        if (!result.success) {
            const errors = result.error.issues.map((i) => ({
                field: i.path.join('.'),
                message: i.message,
            }))
            return {
                error: new Response(
                    JSON.stringify({ error: 'Validation failed', details: errors }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } },
                ),
            }
        }

        return { data: result.data }
    } catch {
        return {
            error: new Response(
                JSON.stringify({ error: 'Invalid JSON body' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            ),
        }
    }
}
