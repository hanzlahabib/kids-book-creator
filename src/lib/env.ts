/**
 * Environment variable validation.
 * Validates required env vars at startup to fail fast if misconfigured.
 */
import { z } from 'zod'

const envSchema = z.object({
    // Database (always required)
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // Auth (required)
    NEXTAUTH_SECRET: z
        .string()
        .min(16, 'NEXTAUTH_SECRET must be at least 16 characters')
        .refine(
            (val) => process.env.NODE_ENV !== 'production' || !val.includes('dev-secret'),
            'NEXTAUTH_SECRET must not contain "dev-secret" in production'
        ),
    NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

    // Encryption (required for BYOK)
    ENCRYPTION_KEY: z
        .string()
        .min(16, 'ENCRYPTION_KEY must be at least 16 characters')
        .refine(
            (val) => process.env.NODE_ENV !== 'production' || !val.includes('dev-encryption'),
            'ENCRYPTION_KEY must not contain "dev-encryption" in production'
        ),

    // App URL
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),

    // AI Providers (at least one recommended)
    OPENAI_API_KEY: z.string().optional(),

    // Stripe (optional, required for subscriptions)
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_STARTER_PRICE_ID: z.string().optional(),
    STRIPE_PRO_PRICE_ID: z.string().optional(),
    STRIPE_UNLIMITED_PRICE_ID: z.string().optional(),

    // Google OAuth (optional)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate environment variables. Call at app startup.
 * Returns the validated env or throws with a clear error message.
 */
export function validateEnv(): Env {
    const result = envSchema.safeParse(process.env)

    if (!result.success) {
        const errors = result.error.issues.map(
            (issue) => `  ❌ ${issue.path.join('.')}: ${issue.message}`
        )
        console.error('\n🚨 Environment validation failed:\n' + errors.join('\n') + '\n')
        throw new Error(`Invalid environment variables:\n${errors.join('\n')}`)
    }

    // Warnings for recommended but optional vars
    if (!result.data.OPENAI_API_KEY) {
        console.warn('⚠️  OPENAI_API_KEY not set — AI generation will only work with BYOK keys')
    }

    if (!result.data.STRIPE_SECRET_KEY) {
        console.warn('⚠️  STRIPE_SECRET_KEY not set — subscriptions and payments disabled')
    }

    return result.data
}

// Singleton validated env — import this in other files
let _env: Env | undefined

export function getEnv(): Env {
    if (!_env) {
        _env = validateEnv()
    }
    return _env
}
