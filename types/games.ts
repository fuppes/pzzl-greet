export type GameType = 'quiz' | 'memory' | 'word' | 'chat_typing' | 'countdown_rhythm' | 'emoji_catcher'

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

// Chat Typing Game Config
export interface ChatTypingConfig {
  duration: number // Game duration in seconds
}

// Countdown Rhythm Game Config
export interface CountdownRhythmConfig {
  startNumber: number // Starting countdown value (e.g., 20)
  targetNumber: number // Target number to reach (e.g., 10)
  beatInterval: number // Milliseconds per beat (e.g., 1000 = 1 second)
  visibleBeats: number // How many beats to show before hiding (e.g., 5)
}

// Emoji Catcher Game Config
export interface EmojiCatcherConfig {
  theme: 'animals' | 'food' | 'sports' | 'party' | 'nature'
  duration: number       // Game duration in seconds (30-120)
  spawnRate: number      // Emojis per second (1-5)
  fallSpeed: number      // Fall speed level (1-5, slow to fast)
}

// Generic Game Config
export type GameConfig = QuizConfig | MemoryConfig | WordConfig | ChatTypingConfig | CountdownRhythmConfig | EmojiCatcherConfig

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
  chat_typing: {
    id: 'chat_typing' as const,
    name: 'Chat Typing Race',
    icon: '💬',
    description: 'Antworte deinen Freunden so schnell wie möglich!',
    defaultConfig: {
      duration: 60,
    } as ChatTypingConfig,
  },
  countdown_rhythm: {
    id: 'countdown_rhythm' as const,
    name: 'Countdown Rhythmus',
    icon: '⏱️',
    description: 'Halte den Rhythmus und stoppe zur richtigen Zeit!',
    defaultConfig: {
      startNumber: 20,
      targetNumber: 10,
      beatInterval: 1000,
      visibleBeats: 5,
    } as CountdownRhythmConfig,
  },
  emoji_catcher: {
    id: 'emoji_catcher' as const,
    name: 'Emoji Catcher',
    icon: '🧺',
    description: 'Fange die richtigen Emojis mit deinem Korb!',
    defaultConfig: {
      theme: 'party',
      duration: 45,
      spawnRate: 2,
      fallSpeed: 3,
    } as EmojiCatcherConfig,
  },
} as const
