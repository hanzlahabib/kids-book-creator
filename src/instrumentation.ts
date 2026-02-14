/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts up.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { validateEnv } = await import('@/lib/env')
        validateEnv()
        console.log('✅ Environment validated successfully')
    }
}
