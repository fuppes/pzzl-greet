export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number // index of correct option
  points: number
}

export interface QuizData {
  title: string
  description: string
  questions: QuizQuestion[]
  timePerQuestion?: number // in seconds (optional)
}

// Sample quiz data - can be replaced/customized
export const defaultQuiz: QuizData = {
  title: 'Lustiges Wissensquiz',
  description: 'Beantwortet gemeinsam diese 2 Fragen!',
  questions: [
    {
      id: 'q1',
      question: 'Welches Tier schläft im Stehen?',
      options: ['Pferd', 'Kuh', 'Giraffe', 'Alle drei'],
      correctAnswer: 3,
      points: 10,
    },
    {
      id: 'q2',
      question: 'Wie viele Herzen hat ein Oktopus?',
      options: ['1', '2', '3', '8'],
      correctAnswer: 2,
      points: 10,
    },
  ],
  timePerQuestion: 30, // 30 seconds per question
}
