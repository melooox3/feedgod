import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_DEBUG: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  OPENAI_API_KEY: z.string().optional(),
  SURGE_API_URL: z.string().default('http://localhost:9000'),
  SURGE_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_DEBUG: process.env.NEXT_PUBLIC_DEBUG,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SURGE_API_URL: process.env.SURGE_API_URL,
    SURGE_API_KEY: process.env.SURGE_API_KEY,
  })

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

export const env = validateEnv()

export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'
export const isDebug = env.NEXT_PUBLIC_DEBUG
