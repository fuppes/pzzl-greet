'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import QuizPuzzle from './QuizPuzzle'
import Leaderboard from '../Leaderboard'
import type { QuizData } from '@/lib/puzzles/quiz-data'
import type { Database } from '@/types/database'

type Player = Database['public']['Tables']['players']['Row']

interface QuizWithLeaderboardProps {
  sessionId: string
  playerId: string
  players: Player[]
  quizData: QuizData
  isHost: boolean
  onContinue: () => void
  totalGames?: number
  puzzleIndex?: number
  roomId?: string
  nextGameName?: string
}

export default function QuizWithLeaderboard({
  sessionId,
  playerId,
  players,
  quizData,
  isHost,
  onContinue,
  totalGames = 3,
  puzzleIndex = 0,
  roomId,
  nextGameName,
}: QuizWithLeaderboardProps) {
  const [isFinished, setIsFinished] = useState(false)
  const [allPlayersFinished, setAllPlayersFinished] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const checkAllFinished = async () => {
      // Get all quiz answers for this session
      const { data: actions } = await supabase
        .from('player_actions')
        .select('player_id')
        .eq('session_id', sessionId)
        .eq('puzzle_index', puzzleIndex)
        .eq('action_type', 'quiz_answer')

      if (!actions) return

      // Count answers per player
      const playerAnswerCounts: Record<string, number> = {}
      actions.forEach((action: any) => {
        playerAnswerCounts[action.player_id] = (playerAnswerCounts[action.player_id] || 0) + 1
      })

      // Check if all players have answered all questions
      const allFinished = players.every((player) => {
        const answerCount = playerAnswerCounts[player.id] || 0
        const hasFinished = answerCount >= quizData.questions.length
        return hasFinished
      })

      setAllPlayersFinished(allFinished)
    }

    // Check initially and set up polling as fallback
    checkAllFinished()

    // Poll every 2 seconds when waiting
    let pollInterval: NodeJS.Timeout | null = null
    if (isFinished && !allPlayersFinished) {
      pollInterval = setInterval(checkAllFinished, 2000)
    }

    // Subscribe to new answers
    const channel = supabase
      .channel(`quiz_completion_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_actions',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          checkAllFinished()
        }
      )
      .subscribe()

    return () => {
      if (pollInterval) clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [sessionId, players, quizData.questions.length, isFinished, allPlayersFinished])

  const handleQuizComplete = () => {
    setIsFinished(true)
  }

  // Show leaderboard only when all players are finished
  if (allPlayersFinished) {
    return (
      <Leaderboard
        sessionId={sessionId}
        puzzleIndex={puzzleIndex}
        players={players}
        currentPlayerId={playerId}
        isHost={isHost}
        onContinue={onContinue}
        totalGames={totalGames}
        roomId={roomId}
        nextGameName={nextGameName}
      />
    )
  }

  // Show waiting screen if current player finished but others haven't
  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-sm text-center space-y-6">
          <div className="text-6xl">⏳</div>
          <h2 className="text-3xl font-bold text-white">
            Quiz abgeschlossen!
          </h2>
          <p className="text-xl text-gray-300">
            Warte auf die anderen Spieler...
          </p>
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-300">Andere Spieler spielen noch</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show quiz if not finished yet
  return (
    <QuizPuzzle
      sessionId={sessionId}
      playerId={playerId}
      quizData={quizData}
      onComplete={handleQuizComplete}
      puzzleIndex={puzzleIndex}
    />
  )
}
