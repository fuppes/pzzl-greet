'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QuizData } from '@/lib/puzzles/quiz-data'

interface QuizPuzzleProps {
  sessionId: string
  playerId: string
  quizData: QuizData
  onComplete: () => void
  puzzleIndex?: number
}

export default function QuizPuzzle({
  sessionId,
  playerId,
  quizData,
  onComplete,
  puzzleIndex = 0,
}: QuizPuzzleProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [showResults, setShowResults] = useState(false)

  const currentQuestion = quizData.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1


  const handleAnswerSelect = async (answerIndex: number) => {
    if (hasAnswered) return

    setSelectedAnswer(answerIndex)
    setHasAnswered(true)

    const isCorrect = answerIndex === currentQuestion.correctAnswer
    if (isCorrect) {
      setScore((prev) => prev + currentQuestion.points)
    }

    // Record answer in database
    const supabase = createClient()
    // @ts-ignore - Supabase type issue
    await supabase.from('player_actions').insert({
      session_id: sessionId,
      player_id: playerId,
      puzzle_index: puzzleIndex,
      action_type: 'quiz_answer',
      data: {
        questionId: currentQuestion.id,
        questionIndex: currentQuestionIndex,
        answer: answerIndex,
        isCorrect,
        points: isCorrect ? currentQuestion.points : 0,
      },
    })

    // Show results briefly, then auto-advance (except on last question)
    setTimeout(() => {
      setShowResults(true)

      // Auto-advance to next question after showing results (not on last question)
      if (!isLastQuestion) {
        setTimeout(() => {
          handleNextQuestion()
        }, 1500)
      }
    }, 1000)
  }

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setHasAnswered(false)
    setShowResults(false)
  }

  const getOptionClass = (optionIndex: number) => {
    if (!hasAnswered) {
      return 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/30'
    }

    const isCorrectOption = optionIndex === currentQuestion.correctAnswer
    const isSelectedOption = optionIndex === selectedAnswer

    if (isCorrectOption) {
      return 'bg-green-500/20 border-green-500/50 text-green-300'
    }

    if (isSelectedOption && !isCorrectOption) {
      return 'bg-red-500/20 border-red-500/50 text-red-300'
    }

    return 'bg-white/5 border-white/10 opacity-50'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        {quizData.title && <h2 className="text-3xl font-bold text-white">{quizData.title}</h2>}
        <div className="flex justify-center gap-8 text-sm">
          <div className="px-4 py-2 bg-white/10 rounded-lg">
            <span className="text-gray-400">Frage:</span>{' '}
            <span className="text-white font-semibold">
              {currentQuestionIndex + 1} / {quizData.questions.length}
            </span>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-lg">
            <span className="text-gray-400">Punkte:</span>{' '}
            <span className="text-white font-semibold">{score}</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        <h3 className="text-2xl font-semibold text-white mb-8 text-center">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(currentQuestion.answers || currentQuestion.options || []).map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={hasAnswered}
              className={`p-6 rounded-xl border-2 transition-all text-left font-medium text-lg ${getOptionClass(
                index
              )} disabled:cursor-not-allowed`}
            >
              <span className="mr-3 text-gray-400">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Complete Button (only on last question after answering) */}
      {showResults && isLastQuestion && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <button
            onClick={onComplete}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all"
          >
            Quiz abschließen
          </button>
        </div>
      )}
    </div>
  )
}
