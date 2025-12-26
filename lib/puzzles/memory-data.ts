export interface MemoryCard {
  id: string
  emoji: string
  pairId: string
}

export interface MemoryGameData {
  title: string
  description: string
  pairs: Array<{ emoji: string; name: string }>
}

export const defaultMemory: MemoryGameData = {
  title: 'Memory-Spiel',
  description: 'Findet alle Paare gemeinsam!',
  pairs: [
    { emoji: '🎄', name: 'Weihnachtsbaum' },
    { emoji: '🎁', name: 'Geschenk' },
    { emoji: '⭐', name: 'Stern' },
    { emoji: '🔔', name: 'Glocke' },
    { emoji: '❄️', name: 'Schneeflocke' },
    { emoji: '🎅', name: 'Weihnachtsmann' },
  ],
}

// Generate shuffled memory cards
export function generateMemoryCards(pairs: Array<{ emoji: string; name: string }>): MemoryCard[] {
  const cards: MemoryCard[] = []

  pairs.forEach((pair, index) => {
    const pairId = `pair-${index}`
    cards.push({
      id: `${pairId}-a`,
      emoji: pair.emoji,
      pairId,
    })
    cards.push({
      id: `${pairId}-b`,
      emoji: pair.emoji,
      pairId,
    })
  })

  // Shuffle cards
  return cards.sort(() => Math.random() - 0.5)
}
