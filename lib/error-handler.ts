/**
 * Centralized Error Handling Utilities
 * Provides consistent error handling across the application
 */

import type { PostgrestError } from '@supabase/supabase-js'

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public originalError?: PostgrestError) {
    super(message, originalError?.code, 500)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

/**
 * Handle Supabase query errors consistently
 */
export function handleSupabaseError(error: PostgrestError | null, context: string): never {
  if (!error) return undefined as never

  console.error(`[Database Error] ${context}:`, error)

  throw new DatabaseError(
    `Database operation failed: ${error.message}`,
    error
  )
}

/**
 * Safe wrapper for async operations with error handling
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error(`[Error] ${errorMessage}:`, error)
    throw error instanceof AppError ? error : new AppError(errorMessage)
  }
}

/**
 * Log error for monitoring (can be extended with Sentry, etc.)
 */
export function logError(error: Error, context?: string) {
  const errorInfo = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  }

  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    console.error('[Production Error]', errorInfo)
  } else {
    console.error('[Development Error]', errorInfo)
  }
}

/**
 * User-friendly error messages
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof ValidationError) {
    return error.message
  }

  if (error instanceof DatabaseError) {
    return 'Ein Datenbankfehler ist aufgetreten. Bitte versuche es erneut.'
  }

  // Generic fallback
  return 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.'
}
