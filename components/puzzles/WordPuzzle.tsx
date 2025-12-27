'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import SuccessAnimation from '../SuccessAnimation'
import type { WordGameData } from '@/lib/puzzles/word-data'
import type { Database } from '@/types/database'

type Player = Database['public']['Tables']['players']['Row']

interface WordPuzzleProps {
  sessionId: string
  playerId: string
  players: Player[]
  wordData: WordGameData
  onComplete: () => void
}

interface PlayerAnswer {
  playerId: string
  playerName: string
  answer: string
  isCorrect: boolean
}

export default function WordPuzzle({
  sessionId,
  playerId,
  players,
  wordData,
  onComplete,
}: WordPuzzleProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [hasAnswered, setHasAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([])
  const [score, setScore] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [wordStartTime, setWordStartTime] = useState<number>(Date.now())
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  const currentWord = wordData.words[currentWordIndex]
  const isLastWord = currentWordIndex === wordData.words.length - 1

  // Reset animation when word changes
  useEffect(() => {
    setShowSuccessAnimation(false)
  }, [currentWordIndex])

  // Calculate points based on time: 20 points max, -1 per second after 10s, min 0
  const calculatePoints = (seconds: number): number => {
    if (seconds <= 10) return 20
    const pointsLost = seconds - 10
    return Math.max(0, 20 - pointsLost)
  }

  const currentPoints = calculatePoints(timeElapsed)

  // Timer effect - updates every second
  useEffect(() => {
    if (hasAnswered) return // Stop timer when answered

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - wordStartTime) / 1000)
      setTimeElapsed(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [hasAnswered, wordStartTime])

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to player answers for this word
    const channel = supabase
      .channel(`word_${sessionId}_${currentWordIndex}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_actions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const action = payload.new as any
          if (
            action.action_type === 'word_answer' &&
            action.puzzle_index === 2 &&
            action.data
          ) {
            const data = action.data as any
            if (data.wordIndex === currentWordIndex) {
              const player = players.find((p) => p.id === action.player_id)
              if (player) {
                setPlayerAnswers((prev) => [
                  ...prev.filter((a) => a.playerId !== action.player_id),
                  {
                    playerId: action.player_id,
                    playerName: player.name,
                    answer: data.answer,
                    isCorrect: data.isCorrect,
                  },
                ])
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, currentWordIndex, players])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userAnswer.trim() || hasAnswered) return

    const normalizedAnswer = userAnswer.toUpperCase().trim()
    const normalizedCorrect = currentWord.answer.toUpperCase().trim()
    const correct = normalizedAnswer === normalizedCorrect

    // Calculate final points based on time elapsed
    const finalPoints = correct ? currentPoints : 0

    setHasAnswered(true)
    setIsCorrect(correct)
    setEarnedPoints(finalPoints)

    if (correct) {
      setScore((prev) => prev + finalPoints)
      setShowSuccessAnimation(true)
    }

    // Record answer in database
    const supabase = createClient()
    // @ts-ignore
    await supabase.from('player_actions').insert({
      session_id: sessionId,
      player_id: playerId,
      puzzle_index: 2,
      action_type: 'word_answer',
      data: {
        wordId: currentWord.id,
        wordIndex: currentWordIndex,
        answer: normalizedAnswer,
        isCorrect: correct,
        points: finalPoints,
        timeElapsed: timeElapsed,
      },
    })
  }

  const handleNextWord = () => {
    setCurrentWordIndex((prev) => prev + 1)
    setUserAnswer('')
    setHasAnswered(false)
    setIsCorrect(false)
    setPlayerAnswers([])
    setTimeElapsed(0)
    setWordStartTime(Date.now())
    setEarnedPoints(0)
    setShowSuccessAnimation(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Animation */}
      <SuccessAnimation
        show={showSuccessAnimation}
        message="Perfekt!"
        emoji="⭐"
      />

      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">{wordData.title}</h2>
        <div className="flex justify-center gap-4 text-sm flex-wrap">
          <div className="px-4 py-2 bg-white/10 rounded-lg">
            <span className="text-gray-400">Wort:</span>{' '}
            <span className="text-white font-semibold">
              {currentWordIndex + 1} / {wordData.words.length}
            </span>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-lg">
            <span className="text-gray-400">Gesamt:</span>{' '}
            <span className="text-white font-semibold">{score}</span>
          </div>
          {!hasAnswered && (
            <>
              <div className={`px-4 py-2 rounded-lg ${
                timeElapsed <= 10 ? 'bg-green-500/20 border border-green-500/30' :
                timeElapsed <= 20 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                'bg-red-500/20 border border-red-500/30'
              }`}>
                <span className="text-gray-400">Zeit:</span>{' '}
                <span className="text-white font-semibold">{timeElapsed}s</span>
              </div>
              <div className={`px-4 py-2 rounded-lg ${
                currentPoints === 20 ? 'bg-green-500/20 border border-green-500/30' :
                currentPoints >= 10 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                currentPoints > 0 ? 'bg-orange-500/20 border border-orange-500/30' :
                'bg-red-500/20 border border-red-500/30'
              }`}>
                <span className="text-gray-400">Wert:</span>{' '}
                <span className="text-white font-semibold">{currentPoints} Pkt</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Word Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        <div className="text-center space-y-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">Gemischte Buchstaben:</p>
            <h3 className="text-5xl font-bold text-white tracking-wider mb-4">
              {currentWord.scrambled}
            </h3>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-gray-400">Hinweis:</p>
            <p className="text-lg text-blue-300">{currentWord.hint}</p>
          </div>

          {/* Answer Form */}
          {!hasAnswered && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value.toUpperCase())}
                placeholder="DEINE ANTWORT"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-lg text-white text-center text-2xl font-semibold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase tracking-wider"
                autoComplete="off"
                autoFocus
              />
              <button
                type="submit"
                disabled={!userAnswer.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Antwort absenden
              </button>
            </form>
          )}

          {/* Answer Result */}
          {hasAnswered && (
            <div className="space-y-4">
              {isCorrect ? (
                <div className="p-6 bg-green-500/20 border-2 border-green-500/50 rounded-xl">
                  <p className="text-3xl mb-2">✓</p>
                  <p className="text-xl font-semibold text-green-300">Richtig!</p>
                  <p className="text-2xl font-bold text-white mt-2">{currentWord.answer}</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-2xl font-bold text-green-400">+{earnedPoints} Punkte</p>
                    <p className="text-xs text-gray-400">Zeit: {timeElapsed}s</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-red-500/20 border-2 border-red-500/50 rounded-xl">
                  <p className="text-3xl mb-2">✗</p>
                  <p className="text-xl font-semibold text-red-300">Leider falsch</p>
                  <p className="text-sm text-gray-400 mt-2">Richtige Antwort:</p>
                  <p className="text-2xl font-bold text-white">{currentWord.answer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player Answers and Navigation */}
      {hasAnswered && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm space-y-4">
          {/* Player Answers (only show if there are any) */}
          {playerAnswers.length > 0 && (
            <>
              <h4 className="text-lg font-semibold text-white">
                Antworten ({playerAnswers.length} / {players.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {playerAnswers.map((answer) => (
                  <div
                    key={answer.playerId}
                    className={`p-3 rounded-lg border ${
                      answer.isCorrect
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <p className="text-sm font-medium text-white truncate">
                      {answer.playerName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {answer.isCorrect ? '✓ Richtig' : '✗ Falsch'}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Next Button */}
          {!isLastWord && (
            <button
              onClick={handleNextWord}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all"
            >
              Nächstes Wort
            </button>
          )}

          {/* Complete Button (only on last word) */}
          {isLastWord && (
            <button
              onClick={onComplete}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all"
            >
              Wörter-Rätsel abschließen
            </button>
          )}
        </div>
      )}
    </div>
  )
}
