import { createClient } from '@/lib/supabase/client'

const SCORING_ACTION_TYPES = [
  'quiz_answer',
  'memory_match',
  'memory_mismatch',
  'word_answer',
  'chat_typing_finished',
  'countdown_rhythm_stop',
] as const

export interface PlayerScoreData {
  playerId: string
  score: number
  actionCount: number
}

/**
 * Get aggregated scores for a specific puzzle (game) in a session.
 * Scores can go negative during calculation; floor to 0 at display.
 */
export async function getLeaderboardScores(
  sessionId: string,
  puzzleIndex: number
): Promise<Record<string, PlayerScoreData>> {
  const supabase = createClient()

  const { data: actions } = await supabase
    .from('player_actions')
    .select('*')
    .eq('session_id', sessionId)
    .lte('puzzle_index', puzzleIndex)
    .in('action_type', [...SCORING_ACTION_TYPES])

  const scores: Record<string, PlayerScoreData> = {}

  if (!actions) return scores

  actions.forEach((action: any) => {
    const data = action.data as any
    if (!scores[action.player_id]) {
      scores[action.player_id] = { playerId: action.player_id, score: 0, actionCount: 0 }
    }
    const points = data.points || 0
    scores[action.player_id].score += points
    scores[action.player_id].actionCount += 1
  })

  return scores
}

/**
 * Get cumulative scores across ALL puzzles in a session.
 * Used by FinalLeaderboard.
 */
export async function getFinalScores(
  sessionId: string
): Promise<Record<string, PlayerScoreData>> {
  const supabase = createClient()

  const { data: actions } = await supabase
    .from('player_actions')
    .select('*')
    .eq('session_id', sessionId)
    .in('action_type', [...SCORING_ACTION_TYPES])

  const scores: Record<string, PlayerScoreData> = {}

  if (!actions) return scores

  actions.forEach((action: any) => {
    const data = action.data as any
    if (!scores[action.player_id]) {
      scores[action.player_id] = { playerId: action.player_id, score: 0, actionCount: 0 }
    }
    const points = data.points || 0
    scores[action.player_id].score += points
    scores[action.player_id].actionCount += 1
  })

  return scores
}

/**
 * Floor a score to 0 for display purposes.
 * Call this only at the UI layer, not during aggregation.
 */
export function displayScore(score: number): number {
  return Math.max(0, score)
}
