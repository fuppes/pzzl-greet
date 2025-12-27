// Helper functions for type-safe Supabase operations
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Type-safe update for rooms table
 */
export async function updateRoom(
  supabase: TypedSupabaseClient,
  roomId: string,
  updates: Partial<Database['public']['Tables']['rooms']['Update']>
) {
  return await supabase
    .from('rooms')
    .update(updates)
    .eq('id', roomId)
}

/**
 * Type-safe insert for player_messages table
 */
export async function insertPlayerMessage(
  supabase: TypedSupabaseClient,
  message: Database['public']['Tables']['player_messages']['Insert']
) {
  return await supabase
    .from('player_messages')
    .insert(message)
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
  return await supabase
    .from('player_actions')
    .insert(action)
}

/**
 * Type-safe insert for players table
 */
export async function insertPlayer(
  supabase: TypedSupabaseClient,
  player: Database['public']['Tables']['players']['Insert'] & { avatar?: string }
) {
  return await supabase
    .from('players')
    .insert(player)
    .select()
    .single()
}

/**
 * Type-safe insert for game_sessions table
 */
export async function updateGameSession(
  supabase: TypedSupabaseClient,
  sessionId: string,
  updates: Partial<Database['public']['Tables']['game_sessions']['Update']>
) {
  return await supabase
    .from('game_sessions')
    .update(updates)
    .eq('id', sessionId)
}
