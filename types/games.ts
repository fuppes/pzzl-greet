export type GameType = 'quiz' | 'memory' | 'word'

// Quiz Game Config
export interface QuizQuestion {
  question: string
  answers: string[]
  correctAnswer: number
  points: number
}

export interface QuizConfig {
  questions: QuizQuestion[]
}

// Memory Game Config
export interface MemoryPair {
  id: number
  content: string
}

export interface MemoryConfig {
  pairs: MemoryPair[]
}

// Word Game Config
export interface WordPuzzle {
  scrambled: string
  answer: string
  hint: string
  points: number
}

export interface WordConfig {
  words: WordPuzzle[]
}

// Generic Game Config
export type GameConfig = QuizConfig | MemoryConfig | WordConfig

// Game Database Type
export interface Game {
  id: string
  name: string
  description?: string
  game_type: GameType
  config: GameConfig
  created_at: string
  updated_at: string
}

// Room Game Queue
export interface RoomGameQueue {
  id: string
  room_id: string
  game_id: string
  queue_position: number
  created_at: string
}

// Extended with game details
export interface RoomGameQueueWithGame extends RoomGameQueue {
  games: Game
}

// Game Type Metadata
export const GAME_TYPES = {
  quiz: {
    id: 'quiz' as const,
    name: 'Quiz',
    icon: '❓',
    description: 'Wissensquiz mit Multiple-Choice-Fragen',
    defaultConfig: {
      questions: [
        {
          question: 'Beispielfrage?',
          answers: ['Antwort 1', 'Antwort 2', 'Antwort 3', 'Antwort 4'],
          correctAnswer: 0,
          points: 10,
        },
      ],
    } as QuizConfig,
  },
  memory: {
    id: 'memory' as const,
    name: 'Memory',
    icon: '🎴',
    description: 'Finde die passenden Kartenpaare',
    defaultConfig: {
      pairs: [
        { id: 1, content: '🎄' },
        { id: 2, content: '⭐' },
        { id: 3, content: '🎁' },
        { id: 4, content: '🔔' },
        { id: 5, content: '❄️' },
        { id: 6, content: '🎅' },
      ],
    } as MemoryConfig,
  },
  word: {
    id: 'word' as const,
    name: 'Wörter-Rätsel',
    icon: '🔤',
    description: 'Buchstabensalat entwirren',
    defaultConfig: {
      words: [
        {
          scrambled: 'LSEIRVEST',
          answer: 'SILVESTER',
          hint: 'Letzter Tag des Jahres',
          points: 20,
        },
      ],
    } as WordConfig,
  },
} as const
