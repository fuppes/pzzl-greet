// Puzzle module types

export type PuzzleType = 'quiz' | 'memory' | 'word'

export interface PuzzleModule {
  type: PuzzleType
  enabled: boolean
  order: number
  config?: any // Type-specific configuration
}

export interface QuizConfig {
  title: string
  description: string
  questions: Array<{
    id: string
    question: string
    options: string[]
    correctAnswer: number
    points: number
  }>
}

export interface MemoryConfig {
  pairs: Array<{
    emoji: string
    name: string
  }>
}

export interface WordConfig {
  title: string
  description: string
  words: Array<{
    id: string
    scrambled: string
    answer: string
    hint: string
    points: number
  }>
}

export const PUZZLE_TYPES = {
  quiz: {
    id: 'quiz' as const,
    name: 'Quiz',
    icon: '❓',
    description: 'Wissensquiz mit Multiple-Choice-Fragen',
  },
  memory: {
    id: 'memory' as const,
    name: 'Memory',
    icon: '🎴',
    description: 'Finde die passenden Kartenpaare',
  },
  word: {
    id: 'word' as const,
    name: 'Wörter-Rätsel',
    icon: '🔤',
    description: 'Buchstabensalat entwirren',
  },
}
