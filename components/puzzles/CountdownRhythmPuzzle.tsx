'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import SuccessAnimation from '../SuccessAnimation'
import type { CountdownRhythmConfig } from '@/types/games'
import type { Database } from '@/types/database'

type Player = Database['public']['Tables']['players']['Row']

type GamePhase = 'intro' | 'rhythm' | 'hidden' | 'stopped' | 'result'

interface CountdownRhythmPuzzleProps {
  sessionId: string
  playerId: string
  players: Player[]
  gameData: CountdownRhythmConfig
  onComplete: () => void
  puzzleIndex?: number
}

export default function CountdownRhythmPuzzle({
  sessionId,
  playerId,
  players,
  gameData,
  onComplete,
  puzzleIndex = 0,
}: CountdownRhythmPuzzleProps) {
  const [phase, setPhase] = useState<GamePhase>('intro')
  const [currentNumber, setCurrentNumber] = useState(gameData.startNumber)
  const [visibleBeatsShown, setVisibleBeatsShown] = useState(0)
  const [stoppedAt, setStoppedAt] = useState<number | null>(null)
  const [points, setPoints] = useState(0)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasRecordedAction = useRef(false)

  const currentPlayer = players.find((p) => p.id === playerId)

  // Calculate points based on accuracy: 100 points for perfect, -10 per number off, minimum 0
  const calculatePoints = (actual: number, target: number): number => {
    const difference = Math.abs(actual - target)
    return Math.max(0, 100 - difference * 10)
  }

  // Start the game after intro
  useEffect(() => {
    if (phase === 'intro') {
      const timeout = setTimeout(() => {
        setPhase('rhythm')
        startRhythmPhase()
      }, 2000) // Show intro for 2 seconds

      return () => clearTimeout(timeout)
    }
  }, [phase])

  // Rhythm phase: show countdown with visible beats
  const startRhythmPhase = () => {
    setCurrentNumber(gameData.startNumber)
    setVisibleBeatsShown(0)

    timerRef.current = setInterval(() => {
      setVisibleBeatsShown((prev) => {
        const nextBeat = prev + 1

        // Pulse animation on each beat
        setIsPulsing(true)
        setTimeout(() => setIsPulsing(false), 200)

        // Countdown the number
        setCurrentNumber((num) => num - 1)

        // Check if we've shown all visible beats
        if (nextBeat >= gameData.visibleBeats) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
          // Transition to hidden phase
          setTimeout(() => {
            setPhase('hidden')
            startHiddenPhase()
          }, 500)
        }

        return nextBeat
      })
    }, gameData.beatInterval)
  }

  // Hidden phase: continue countdown invisibly
  const startHiddenPhase = () => {
    timerRef.current = setInterval(() => {
      setCurrentNumber((num) => {
        const next = num - 1
        // Optional: auto-stop if player takes too long (e.g., reaches 0)
        if (next <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
          handleStop()
        }
        return next
      })
    }, gameData.beatInterval)
  }

  // Player presses STOP button
  const handleStop = () => {
    if (phase !== 'hidden') return

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setStoppedAt(currentNumber)
    setPhase('stopped')

    // Calculate points
    const earnedPoints = calculatePoints(currentNumber, gameData.targetNumber)
    setPoints(earnedPoints)

    // Show success animation if close enough (within 2 numbers)
    if (Math.abs(currentNumber - gameData.targetNumber) <= 2) {
      setShowSuccessAnimation(true)
    }

    // Record the action to database
    recordAction(currentNumber, earnedPoints)

    // Show result phase
    setTimeout(() => {
      setPhase('result')
    }, 1500)
  }

  // Record player action to database
  const recordAction = async (stoppedNumber: number, earnedPoints: number) => {
    if (hasRecordedAction.current) return
    hasRecordedAction.current = true

    const supabase = createClient()

    try {
      // @ts-ignore - Supabase type issue
      const { error } = await supabase.from('player_actions').insert({
        session_id: sessionId,
        player_id: playerId,
        puzzle_index: puzzleIndex,
        action_type: 'countdown_rhythm_stop',
        data: {
          startNumber: gameData.startNumber,
          targetNumber: gameData.targetNumber,
          stoppedAt: stoppedNumber,
          difference: Math.abs(stoppedNumber - gameData.targetNumber),
          points: earnedPoints,
          beatInterval: gameData.beatInterval,
          visibleBeats: gameData.visibleBeats,
        },
      })

      if (error) {
        console.error('Error recording countdown rhythm action:', error)
      }
    } catch (err) {
      console.error('Exception recording action:', err)
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Handle completion button
  const handleComplete = () => {
    onComplete()
  }

  // Render intro phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-8 text-center">
          <div className="text-6xl mb-6">⏱️</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Countdown Rhythmus
          </h1>
          <p className="text-white/70 text-lg mb-6">
            Beobachte den Rhythmus und stoppe zur richtigen Zeit!
          </p>
          <div className="bg-white/10 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span className="text-white/60">Start:</span>
              <span className="text-white font-bold text-2xl">{gameData.startNumber}</span>
            </div>
            <div className="flex items-center justify-center text-white/40">
              <span>↓ ↓ ↓</span>
            </div>
            <div className="flex items-center justify-between text-lg">
              <span className="text-white/60">Ziel:</span>
              <span className="text-green-400 font-bold text-2xl">{gameData.targetNumber}</span>
            </div>
          </div>
          <p className="text-white/50 text-sm mt-6">
            Das Spiel startet gleich...
          </p>
        </div>
      </div>
    )
  }

  // Render rhythm preview phase
  if (phase === 'rhythm') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <div className="text-white/60 text-lg mb-2">Beobachte den Rhythmus</div>
            <div className="text-white/40 text-sm">
              {visibleBeatsShown + 1} / {gameData.visibleBeats}
            </div>
          </div>

          {/* Main number display with pulse animation */}
          <div
            className={`
              text-[120px] md:text-[180px] font-bold
              bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400
              bg-clip-text text-transparent
              transition-transform duration-200
              ${isPulsing ? 'scale-125' : 'scale-100'}
            `}
          >
            {currentNumber}
          </div>

          {/* Beat indicator dots */}
          <div className="flex justify-center gap-3 mt-8">
            {Array.from({ length: gameData.visibleBeats }).map((_, i) => (
              <div
                key={i}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${i < visibleBeatsShown
                    ? 'bg-gradient-to-r from-blue-400 to-purple-400 scale-100'
                    : i === visibleBeatsShown
                    ? 'bg-gradient-to-r from-blue-400 to-purple-400 scale-125 shadow-lg shadow-blue-400/50'
                    : 'bg-white/20 scale-75'}
                `}
              />
            ))}
          </div>

          <div className="mt-12 text-white/50 text-sm">
            Merke dir den Rhythmus! Die Zahl wird gleich verschwinden...
          </div>
        </div>
      </div>
    )
  }

  // Render hidden countdown phase
  if (phase === 'hidden') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-12">
            <div className="text-white/60 text-lg mb-4">Zähle im Rhythmus weiter...</div>
            <div className="text-6xl mb-8">🤔</div>
          </div>

          {/* Hidden number placeholder */}
          <div className="text-[120px] md:text-[180px] font-bold text-white/10 mb-12">
            ???
          </div>

          {/* STOP button - large and touch-friendly */}
          <button
            onClick={handleStop}
            className="
              px-16 py-8
              bg-gradient-to-r from-red-600 to-pink-600
              hover:from-red-500 hover:to-pink-500
              text-white font-bold text-3xl rounded-2xl
              shadow-lg shadow-red-500/50
              transition-all duration-200
              hover:scale-105 active:scale-95
              border-4 border-white/20
            "
          >
            STOP!
          </button>

          <div className="mt-12 text-white/50 text-sm">
            Drücke STOP, wenn du glaubst bei <span className="text-green-400 font-bold">{gameData.targetNumber}</span> zu sein
          </div>
        </div>
      </div>
    )
  }

  // Render stopped/calculating phase
  if (phase === 'stopped') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center p-4">
        {showSuccessAnimation && <SuccessAnimation show={showSuccessAnimation} />}
        <div className="max-w-2xl w-full text-center">
          <div className="text-6xl mb-6">⏸️</div>
          <div className="text-white/60 text-lg mb-8">Du hast gestoppt bei...</div>
          <div className="text-[120px] md:text-[180px] font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {stoppedAt}
          </div>
        </div>
      </div>
    )
  }

  // Render result phase
  if (phase === 'result') {
    const difference = Math.abs((stoppedAt || 0) - gameData.targetNumber)
    const isPerfect = difference === 0
    const isClose = difference <= 2
    const isFar = difference > 5

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center p-4">
        {showSuccessAnimation && <SuccessAnimation show={showSuccessAnimation} />}
        <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-8">
          {/* Result header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {isPerfect ? '🎯' : isClose ? '👍' : isFar ? '😅' : '👌'}
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              {isPerfect ? 'Perfekt!' : isClose ? 'Sehr gut!' : isFar ? 'Versuch es weiter!' : 'Nicht schlecht!'}
            </h2>
          </div>

          {/* Score breakdown */}
          <div className="space-y-6 mb-8">
            <div className="bg-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60">Deine Zahl:</span>
                <span className="text-white font-bold text-2xl">{stoppedAt}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60">Zielzahl:</span>
                <span className="text-green-400 font-bold text-2xl">{gameData.targetNumber}</span>
              </div>
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60">Differenz:</span>
                  <span className="text-orange-400 font-bold text-xl">{difference}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Punkte:</span>
                  <span className="text-yellow-400 font-bold text-3xl">{points}</span>
                </div>
              </div>
            </div>

            {/* Player info */}
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-white/5 rounded-full px-6 py-3">
                <span className="text-2xl">{currentPlayer?.avatar || '👤'}</span>
                <span className="text-white font-medium">{currentPlayer?.name || 'Spieler'}</span>
              </div>
            </div>
          </div>

          {/* Complete button */}
          <button
            onClick={handleComplete}
            className="
              w-full py-4
              bg-gradient-to-r from-blue-600 to-purple-600
              hover:from-blue-500 hover:to-purple-500
              text-white font-bold text-xl rounded-xl
              transition-all duration-200
              hover:scale-105 active:scale-95
            "
          >
            Weiter
          </button>
        </div>
      </div>
    )
  }

  return null
}
