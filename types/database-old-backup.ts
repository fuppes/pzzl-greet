export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          room_id: string
          session_code: string
          host_player_id: string | null
          status: 'waiting' | 'in_progress' | 'completed'
          current_puzzle_index: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          session_code: string
          host_player_id?: string | null
          status?: 'waiting' | 'in_progress' | 'completed'
          current_puzzle_index?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          session_code?: string
          host_player_id?: string | null
          status?: 'waiting' | 'in_progress' | 'completed'
          current_puzzle_index?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          session_id: string
          name: string
          color: string | null
          is_connected: boolean
          joined_at: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          color?: string | null
          is_connected?: boolean
          joined_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          color?: string | null
          is_connected?: boolean
          joined_at?: string
          last_seen_at?: string
        }
      }
      game_progress: {
        Row: {
          id: string
          session_id: string
          puzzle_index: number
          puzzle_type: string
          is_completed: boolean
          score: number
          data: Json | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          puzzle_index: number
          puzzle_type: string
          is_completed?: boolean
          score?: number
          data?: Json | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          puzzle_index?: number
          puzzle_type?: string
          is_completed?: boolean
          score?: number
          data?: Json | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      player_actions: {
        Row: {
          id: string
          session_id: string
          player_id: string
          puzzle_index: number
          action_type: string
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          player_id: string
          puzzle_index: number
          action_type: string
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          player_id?: string
          puzzle_index?: number
          action_type?: string
          data?: Json | null
          created_at?: string
        }
      }
      greeting_content: {
        Row: {
          id: string
          room_id: string
          content_type: string
          content_url: string | null
          content_text: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          content_type: string
          content_url?: string | null
          content_text?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          content_type?: string
          content_url?: string | null
          content_text?: string | null
          order_index?: number
          created_at?: string
        }
      }
    }
  }
}
