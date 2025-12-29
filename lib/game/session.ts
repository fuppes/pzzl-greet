import { Database } from '@/types/database'

type GameSession = Database['public']['Tables']['game_sessions']['Row']
type Player = Database['public']['Tables']['players']['Row']

// Generate a random session code (6 characters, uppercase)
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Generate a random player color
export function generatePlayerColor(): string {
  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Create a new game session
export interface CreateSessionParams {
  roomId: string
  hostPlayerId?: string
}

export function createSessionData(params: CreateSessionParams) {
  return {
    room_id: params.roomId,
    session_code: generateSessionCode(),
    host_player_id: params.hostPlayerId || null,
    status: 'waiting' as const,
    current_puzzle_index: 0,
  }
}

// Create a new player
export interface CreatePlayerParams {
  sessionId: string
  name: string
  avatar?: string
}

export function createPlayerData(params: CreatePlayerParams) {
  return {
    session_id: params.sessionId,
    name: params.name,
    avatar: params.avatar || '😀',
    color: generatePlayerColor(),
    is_connected: true,
  }
}

// Check if session is expired or completed
export function isSessionActive(session: GameSession): boolean {
  return session.status !== 'completed'
}

// Get player count for a session
export function getPlayerCount(players: Player[]): number {
  return players.filter(p => p.is_connected).length
}
