export interface WordPuzzle {
  id: string
  scrambled: string
  answer: string
  hint: string
  points: number
}

export interface WordGameData {
  title: string
  description: string
  words: WordPuzzle[]
}

export const defaultWordGame: WordGameData = {
  title: 'Wörter-Rätsel',
  description: 'Findet die richtigen Wörter!',
  words: [
    {
      id: 'w1',
      scrambled: 'SETLVRISE',
      answer: 'SILVESTER',
      hint: 'Letzter Tag des Jahres',
      points: 15,
    },
    {
      id: 'w2',
      scrambled: 'REWKRUEEF',
      answer: 'FEUERWERK',
      hint: 'Buntes Spektakel am Himmel',
      points: 15,
    },
    {
      id: 'w3',
      scrambled: 'UHAJERN',
      answer: 'NEUJAHR',
      hint: 'Erster Tag des Jahres',
      points: 15,
    },
  ],
}

// Helper function to scramble a word
export function scrambleWord(word: string): string {
  const chars = word.split('')
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
