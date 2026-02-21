export interface EmojiTheme {
  id: string
  name: string
  icon: string
  correct: string[]
  wrong: string[]
}

export const EMOJI_CATCHER_THEMES: Record<string, EmojiTheme> = {
  animals: {
    id: 'animals',
    name: 'Tiere',
    icon: '🐶',
    correct: ['🐶', '🐱', '🐭', '🐹', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁'],
    wrong: ['🌸', '🚗', '💎', '🔥', '⚡', '🎸', '🏠', '📱'],
  },
  food: {
    id: 'food',
    name: 'Essen',
    icon: '🍕',
    correct: ['🍕', '🍔', '🌮', '🍣', '🍩', '🍪', '🎂', '🍓', '🍎', '🥑'],
    wrong: ['🐶', '⚽', '🎵', '🚗', '💎', '🔥', '📱', '🏠'],
  },
  sports: {
    id: 'sports',
    name: 'Sport',
    icon: '⚽',
    correct: ['⚽', '🏀', '🎾', '🏈', '⚾', '🏐', '🎱', '🏓', '🥊', '🏋️'],
    wrong: ['🍕', '🌸', '🐶', '💎', '🔥', '🎸', '📱', '🏠'],
  },
  party: {
    id: 'party',
    name: 'Party',
    icon: '🎉',
    correct: ['🎉', '🎊', '🥳', '🎈', '🎁', '🍾', '🥂', '🎆', '🎇', '✨'],
    wrong: ['🐶', '🍕', '⚽', '🚗', '🏠', '📱', '🔧', '📚'],
  },
  nature: {
    id: 'nature',
    name: 'Natur',
    icon: '🌸',
    correct: ['🌸', '🌺', '🌻', '🌲', '🌴', '🍀', '☘️', '🌈', '⭐', '🌙'],
    wrong: ['🍕', '🚗', '⚽', '💎', '🎸', '📱', '🏠', '🔧'],
  },
}

/** Pick a random emoji from the theme. ~60% chance correct, ~40% wrong. */
export function getRandomEmoji(theme: EmojiTheme): { emoji: string; isCorrect: boolean } {
  const isCorrect = Math.random() < 0.6
  const pool = isCorrect ? theme.correct : theme.wrong
  const emoji = pool[Math.floor(Math.random() * pool.length)]
  return { emoji, isCorrect }
}
