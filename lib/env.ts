import { z } from 'zod'

/**
 * Environment Variable Validation
 * Validates all required environment variables at build time
 * Prevents runtime crashes from missing configuration
 */

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase Anon Key is required'),
})

// Validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  } catch (error) {
    console.error('❌ Invalid environment variables:')
    console.error(error)
    throw new Error('Invalid environment variables - check .env.local')
  }
}

export const env = parseEnv()

// Type-safe access to environment variables
export type Env = z.infer<typeof envSchema>
