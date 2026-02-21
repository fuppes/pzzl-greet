'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EmojiCatcherConfig } from '@/types/games'
import type { Database } from '@/types/database'
import { EMOJI_CATCHER_THEMES, getRandomEmoji } from '@/lib/puzzles/emoji-catcher-data'

type Player = Database['public']['Tables']['players']['Row']

type GamePhase = 'rules' | 'playing' | 'result'

interface FallingEmoji {
  id: string
  emoji: string
  isCorrect: boolean
  x: number // percentage 0-100
  createdAt: number
}

interface FeedbackEffect {
  id: string
  x: number
  y: number
  text: string
  isPositive: boolean
}

interface EmojiCatcherPuzzleProps {
  sessionId: string
  playerId: string
  players: Player[]
  gameData: EmojiCatcherConfig
  onComplete: () => void
  puzzleIndex?: number
}

// Map fallSpeed (1-5) to animation duration in seconds (5s-1.5s)
const FALL_DURATIONS = [5, 4, 3, 2.25, 1.5]

const POINTS_CORRECT = 10
const POINTS_WRONG = -5

export default function EmojiCatcherPuzzle({
  sessionId,
  playerId,
  players,
  gameData,
  onComplete,
  puzzleIndex = 0,
}: EmojiCatcherPuzzleProps) {
  const [phase, setPhase] = useState<GamePhase>('rules')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(gameData.duration)
  const [fallingEmojis, setFallingEmojis] = useState<FallingEmoji[]>([])
  const [basketX, setBasketX] = useState(50) // percentage
  const [feedbackEffects, setFeedbackEffects] = useState<FeedbackEffect[]>([])
  const [caughtCount, setCaughtCount] = useState(0)
  const [missedCount, setMissedCount] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const basketRef = useRef<HTMLDivElement>(null)
  const hasRecordedAction = useRef(false)
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const gameLoopRef = useRef<number | null>(null)
  const scoreRef = useRef(0)
  const caughtRef = useRef(0)
  const missedRef = useRef(0)

  const theme = EMOJI_CATCHER_THEMES[gameData.theme] || EMOJI_CATCHER_THEMES.party
  const fallDuration = FALL_DURATIONS[Math.min(Math.max(gameData.fallSpeed - 1, 0), 4)]
  const currentPlayer = players.find((p) => p.id === playerId)

  // Keep refs in sync
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { caughtRef.current = caughtCount }, [caughtCount])
  useEffect(() => { missedRef.current = missedCount }, [missedCount])

  // Spawn emojis
  const spawnEmoji = useCallback(() => {
    const { emoji, isCorrect } = getRandomEmoji(theme)
    const newEmoji: FallingEmoji = {
      id: `emoji-${Date.now()}-${Math.random()}`,
      emoji,
      isCorrect,
      x: 5 + Math.random() * 90, // 5%-95% to avoid edges
      createdAt: Date.now(),
    }
    setFallingEmojis((prev) => {
      // Cap at ~15 simultaneous emojis
      if (prev.length >= 15) return prev
      return [...prev, newEmoji]
    })
  }, [theme])

  // Record player action to database
  const recordAction = useCallback(async () => {
    if (hasRecordedAction.current) return
    hasRecordedAction.current = true

    const supabase = createClient()
    try {
      // @ts-ignore - Supabase type issue
      const { error } = await supabase.from('player_actions').insert({
        session_id: sessionId,
        player_id: playerId,
        puzzle_index: puzzleIndex,
        action_type: 'emoji_catcher_finished',
        data: {
          points: Math.max(0, scoreRef.current),
          theme: gameData.theme,
          duration: gameData.duration,
          caught: caughtRef.current,
          missed: missedRef.current,
        },
      })
      if (error) console.error('Error recording emoji catcher action:', error)
    } catch (err) {
      console.error('Exception recording action:', err)
    }
  }, [sessionId, playerId, puzzleIndex, gameData.theme, gameData.duration])

  // End game
  const endGame = useCallback(() => {
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    spawnIntervalRef.current = null
    timerIntervalRef.current = null
    gameLoopRef.current = null

    setFallingEmojis([])
    setPhase('result')

    recordAction()
  }, [recordAction])

  // Game loop: check collisions & remove fallen emojis
  const runGameLoop = useCallback(() => {
    if (!containerRef.current || !basketRef.current) {
      gameLoopRef.current = requestAnimationFrame(runGameLoop)
      return
    }

    const containerRect = containerRef.current.getBoundingClientRect()
    const basketRect = basketRef.current.getBoundingClientRect()
    const catchZoneTop = containerRect.bottom - 60

    setFallingEmojis((prev) => {
      const remaining: FallingEmoji[] = []
      const newFeedback: FeedbackEffect[] = []

      prev.forEach((emoji) => {
        const emojiEl = document.getElementById(emoji.id)
        if (!emojiEl) {
          remaining.push(emoji)
          return
        }

        const emojiRect = emojiEl.getBoundingClientRect()

        // Check if emoji reached the catch zone (near bottom)
        const emojiBottom = emojiRect.top + emojiRect.height

        if (emojiBottom >= catchZoneTop) {
          // Check horizontal overlap with basket
          const emojiCenterX = emojiRect.left + emojiRect.width / 2
          const basketLeft = basketRect.left
          const basketRight = basketRect.right

          if (emojiCenterX >= basketLeft && emojiCenterX <= basketRight) {
            // Caught!
            const points = emoji.isCorrect ? POINTS_CORRECT : POINTS_WRONG
            setScore((s) => s + points)
            if (emoji.isCorrect) {
              setCaughtCount((c) => c + 1)
            }

            newFeedback.push({
              id: `fb-${Date.now()}-${Math.random()}`,
              x: emojiRect.left - containerRect.left + emojiRect.width / 2,
              y: emojiRect.top - containerRect.top,
              text: emoji.isCorrect ? `+${POINTS_CORRECT}` : `${POINTS_WRONG}`,
              isPositive: emoji.isCorrect,
            })
            // Don't add to remaining — emoji is caught
            return
          }
        }

        // Check if emoji fell past the bottom
        if (emojiRect.top > containerRect.bottom) {
          if (emoji.isCorrect) {
            setMissedCount((m) => m + 1)
          }
          // Remove — fell off screen
          return
        }

        remaining.push(emoji)
      })

      if (newFeedback.length > 0) {
        setFeedbackEffects((prev) => [...prev, ...newFeedback])
        // Auto-remove feedback after 800ms
        setTimeout(() => {
          setFeedbackEffects((prev) =>
            prev.filter((f) => !newFeedback.some((nf) => nf.id === f.id))
          )
        }, 800)
      }

      return remaining
    })

    gameLoopRef.current = requestAnimationFrame(runGameLoop)
  }, [])

  // Start game
  const startGame = () => {
    setPhase('playing')
    setScore(0)
    setTimeLeft(gameData.duration)
    setFallingEmojis([])
    setCaughtCount(0)
    setMissedCount(0)
    setBasketX(50)

    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Start spawning
    const spawnMs = 1000 / gameData.spawnRate
    spawnIntervalRef.current = setInterval(spawnEmoji, spawnMs)

    // Start game loop
    gameLoopRef.current = requestAnimationFrame(runGameLoop)
  }

  // Handle touch/mouse drag for basket
  const handlePointerMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const percentage = (relativeX / rect.width) * 100
    setBasketX(Math.max(5, Math.min(95, percentage)))
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    handlePointerMove(e.touches[0].clientX)
  }, [handlePointerMove])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handlePointerMove(e.clientX)
  }, [handlePointerMove])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [])

  // Rules phase
  if (phase === 'rules') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-8 text-center">
          <div className="text-6xl mb-6">🧺</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            Emoji Catcher
          </h1>

          <div className="space-y-4 text-left mb-8">
            <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
              <span className="text-2xl mt-0.5">🎯</span>
              <p className="text-white/80">
                Fange die <span className="font-bold text-green-400">{theme.name}-Emojis</span> mit deinem Korb!
              </p>
            </div>
            <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
              <span className="text-2xl mt-0.5">👆</span>
              <p className="text-white/80">
                Bewege den Korb mit dem Finger (oder der Maus) nach links und rechts.
              </p>
            </div>
            <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
              <span className="text-2xl mt-0.5">✅</span>
              <p className="text-white/80">
                Richtige Emojis: <span className="font-bold text-green-400">+{POINTS_CORRECT} Punkte</span>
              </p>
            </div>
            <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
              <span className="text-2xl mt-0.5">❌</span>
              <p className="text-white/80">
                Falsche Emojis: <span className="font-bold text-red-400">{POINTS_WRONG} Punkte</span>
              </p>
            </div>
          </div>

          {/* Theme preview */}
          <div className="bg-white/5 rounded-xl p-4 mb-8">
            <p className="text-white/60 text-sm mb-2">Fange diese Emojis:</p>
            <div className="text-3xl flex flex-wrap justify-center gap-2">
              {theme.correct.slice(0, 6).map((e, i) => (
                <span key={i}>{e}</span>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            className="
              w-full py-4
              bg-gradient-to-r from-blue-600 to-purple-600
              hover:from-blue-500 hover:to-purple-500
              text-white font-bold text-xl rounded-xl
              transition-all duration-200
              hover:scale-105 active:scale-95
            "
          >
            Los geht&apos;s!
          </button>
        </div>
      </div>
    )
  }

  // Playing phase
  if (phase === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex flex-col select-none">
        {/* HUD */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/50">
          <div className="text-white font-bold text-lg">
            {theme.icon} {theme.name}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-yellow-400 font-bold text-lg">
              {Math.max(0, score)} Pkt
            </div>
            <div className={`font-bold text-lg ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden touch-none"
          onTouchMove={handleTouchMove}
          onMouseMove={handleMouseMove}
        >
          {/* Falling Emojis */}
          {fallingEmojis.map((emoji) => (
            <span
              key={emoji.id}
              id={emoji.id}
              className="absolute text-3xl pointer-events-none"
              style={{
                left: `${emoji.x}%`,
                top: '-40px',
                transform: 'translateX(-50%)',
                animation: `emojiCatcherFall ${fallDuration}s linear forwards`,
              }}
            >
              {emoji.emoji}
            </span>
          ))}

          {/* Feedback effects */}
          {feedbackEffects.map((effect) => (
            <div
              key={effect.id}
              className={`absolute font-bold text-lg pointer-events-none ${
                effect.isPositive ? 'text-green-400' : 'text-red-400'
              }`}
              style={{
                left: effect.x,
                top: effect.y,
                animation: 'emojiCatcherFeedback 0.8s ease-out forwards',
              }}
            >
              {effect.text}
            </div>
          ))}

          {/* Basket */}
          <div
            ref={basketRef}
            className="absolute bottom-4 text-5xl transition-none"
            style={{
              left: `${basketX}%`,
              transform: 'translateX(-50%)',
            }}
          >
            🧺
          </div>
        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes emojiCatcherFall {
            from { top: -40px; }
            to { top: 110%; }
          }
          @keyframes emojiCatcherFeedback {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-40px); }
          }
        `}</style>
      </div>
    )
  }

  // Result phase
  if (phase === 'result') {
    const finalScore = Math.max(0, score)
    const isGreat = finalScore >= 100
    const isGood = finalScore >= 50
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {isGreat ? '🏆' : isGood ? '👍' : '👌'}
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              {isGreat ? 'Fantastisch!' : isGood ? 'Gut gemacht!' : 'Nicht schlecht!'}
            </h2>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60">Gefangen:</span>
                <span className="text-green-400 font-bold text-2xl">{caughtCount}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60">Verpasst:</span>
                <span className="text-orange-400 font-bold text-2xl">{missedCount}</span>
              </div>
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Punkte:</span>
                  <span className="text-yellow-400 font-bold text-3xl">{finalScore}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-white/5 rounded-full px-6 py-3">
                <span className="text-2xl">{currentPlayer?.avatar || '👤'}</span>
                <span className="text-white font-medium">{currentPlayer?.name || 'Spieler'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onComplete}
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
