// Helper functions for type-safe Supabase operations
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { handleSupabaseError } from '@/lib/error-handler'

type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Type-safe update for rooms table
 */
export async function updateRoom(
  supabase: TypedSupabaseClient,
  roomId: string,
  updates: Partial<Database['public']['Tables']['rooms']['Update']>
) {
  const { error } = await supabase
    .from('rooms')
    // @ts-expect-error - Supabase type inference issue
    .update(updates)
    .eq('id', roomId)

  if (error) handleSupabaseError(error, 'updateRoom')
}

/**
 * Type-safe insert for player_messages table
 */
export async function insertPlayerMessage(
  supabase: TypedSupabaseClient,
  message: Database['public']['Tables']['player_messages']['Insert']
) {
  const { error } = await supabase
    .from('player_messages')
    // @ts-expect-error - Supabase type inference issue
    .insert(message)

  if (error) handleSupabaseError(error, 'insertPlayerMessage')
}

/**
 * Type-safe insert for player_actions table
 */
export async function insertPlayerAction(
  supabase: TypedSupabaseClient,
  action: {
    session_id: string
    player_id: string
    puzzle_index: number
    action_type: string
    data: any
  }
) {
  const { error } = await supabase
    .from('player_actions')
    // @ts-expect-error - Supabase type inference issue
    .insert(action)

  if (error) handleSupabaseError(error, 'insertPlayerAction')
}

/**
 * Type-safe insert for players table
 */
export async function insertPlayer(
  supabase: TypedSupabaseClient,
  player: Database['public']['Tables']['players']['Insert'] & { avatar?: string }
) {
  const { data, error } = await supabase
    .from('players')
    // @ts-expect-error - Supabase type inference issue
    .insert(player)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'insertPlayer')
  return data
}

/**
 * Type-safe update for game_sessions table
 */
export async function updateGameSession(
  supabase: TypedSupabaseClient,
  sessionId: string,
  updates: Partial<Database['public']['Tables']['game_sessions']['Update']>
) {
  const { error } = await supabase
    .from('game_sessions')
    // @ts-expect-error - Supabase type inference issue
    .update(updates)
    .eq('id', sessionId)

  if (error) handleSupabaseError(error, 'updateGameSession')
}
