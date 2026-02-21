# Emoji Catcher Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an "Emoji Catcher" minigame where falling emojis must be caught with a draggable basket, with theme-based scoring and admin configuration.

**Architecture:** New game type following the existing Puzzle + WithLeaderboard wrapper pattern. Theme data in a separate data module. Touch-drag basket with CSS-animated falling emojis, collision detection via bounding boxes. Scores saved as `player_action` rows, integrated into existing leaderboard flow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Supabase (player_actions table), CSS animations for falling emojis.

---

### Task 1: Add type definitions to `types/games.ts`

**Files:**
- Modify: `types/games.ts`

**Step 1: Add EmojiCatcherConfig interface and update GameType**

Add to `types/games.ts` after the CountdownRhythmConfig interface (line 48):

```typescript
// Emoji Catcher Game Config
export interface EmojiCatcherConfig {
  theme: 'animals' | 'food' | 'sports' | 'party' | 'nature'
  duration: number       // Game duration in seconds (30-120)
  spawnRate: number      // Emojis per second (1-5)
  fallSpeed: number      // Fall speed level (1-5, slow to fast)
}
```

Update the `GameType` union on line 1:

```typescript
export type GameType = 'quiz' | 'memory' | 'word' | 'chat_typing' | 'countdown_rhythm' | 'emoji_catcher'
```

Update `GameConfig` on line 51:

```typescript
export type GameConfig = QuizConfig | MemoryConfig | WordConfig | ChatTypingConfig | CountdownRhythmConfig | EmojiCatcherConfig
```

Add to `GAME_TYPES` object (after countdown_rhythm entry):

```typescript
emoji_catcher: {
  id: 'emoji_catcher' as const,
  name: 'Emoji Catcher',
  icon: '🧺',
  description: 'Fange die richtigen Emojis mit deinem Korb!',
  defaultConfig: {
    theme: 'party',
    duration: 45,
    spawnRate: 2,
    fallSpeed: 3,
  } as EmojiCatcherConfig,
},
```

**Step 2: Verify build**

Run: `cd /Users/dam/dev/grtngs.dana && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds (or only pre-existing warnings)

**Step 3: Commit**

```bash
git add types/games.ts
git commit -m "feat: add emoji_catcher type definitions"
```

---

### Task 2: Add scoring integration to `lib/scoring.ts`

**Files:**
- Modify: `lib/scoring.ts:3-9`

**Step 1: Add emoji_catcher_finished to SCORING_ACTION_TYPES**

Update the array on line 3:

```typescript
const SCORING_ACTION_TYPES = [
  'quiz_answer',
  'memory_match',
  'memory_mismatch',
  'word_answer',
  'chat_typing_finished',
  'countdown_rhythm_stop',
  'emoji_catcher_finished',
] as const
```

**Step 2: Commit**

```bash
git add lib/scoring.ts
git commit -m "feat: add emoji_catcher_finished to scoring action types"
```

---

### Task 3: Create emoji theme data module

**Files:**
- Create: `lib/puzzles/emoji-catcher-data.ts`

**Step 1: Create the theme data file**

```typescript
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
```

**Step 2: Commit**

```bash
git add lib/puzzles/emoji-catcher-data.ts
git commit -m "feat: add emoji catcher theme data module"
```

---

### Task 4: Create the EmojiCatcherPuzzle component

**Files:**
- Create: `components/puzzles/EmojiCatcherPuzzle.tsx`

**Step 1: Create the main game component**

This is the largest file. Key implementation details:

- **State:** `score`, `timeLeft`, `fallingEmojis[]`, `basketX`, `feedbackEffects[]`, `phase` (rules/playing/result)
- **Spawning:** `setInterval` based on `spawnRate`, creates emoji objects with `{ id, emoji, isCorrect, x, createdAt }`
- **Falling:** Each emoji gets a CSS animation `@keyframes fall` with duration based on `fallSpeed` (map 1-5 to 5s-1.5s)
- **Collision detection:** On `animationiteration` or via a game loop checking emoji Y-position vs basket Y-position and X overlap
- **Basket:** `onTouchMove` / `onMouseMove` updates `basketX` state, clamped to container bounds
- **Cleanup:** `onAnimationEnd` removes emoji from state when it reaches bottom
- **Score recording:** On timer end, insert `player_action` with `action_type: 'emoji_catcher_finished'` and `data: { points: score, theme, duration, caught, missed }`

```typescript
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

const BASKET_WIDTH_PX = 80
const EMOJI_SIZE_PX = 40
const CATCH_ZONE_BOTTOM_PX = 60 // how far from bottom the catch zone starts
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

  // Game loop: check collisions & remove fallen emojis
  const runGameLoop = useCallback(() => {
    if (!containerRef.current || !basketRef.current) {
      gameLoopRef.current = requestAnimationFrame(runGameLoop)
      return
    }

    const containerRect = containerRef.current.getBoundingClientRect()
    const basketRect = basketRef.current.getBoundingClientRect()

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
        const catchZoneTop = containerRect.bottom - CATCH_ZONE_BOTTOM_PX

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

    // Record action
    recordAction()
  }, [])

  // Record player action to database
  const recordAction = async () => {
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
    if (e.buttons > 0 || true) { // Always track mouse position during game
      handlePointerMove(e.clientX)
    }
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
```

**Step 2: Verify build**

Run: `cd /Users/dam/dev/grtngs.dana && npx next build --no-lint 2>&1 | tail -10`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/puzzles/EmojiCatcherPuzzle.tsx
git commit -m "feat: add EmojiCatcherPuzzle game component"
```

---

### Task 5: Create the EmojiCatcherWithLeaderboard wrapper

**Files:**
- Create: `components/puzzles/EmojiCatcherWithLeaderboard.tsx`

**Step 1: Create the wrapper component**

Follow the exact same pattern as `CountdownRhythmWithLeaderboard.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import EmojiCatcherPuzzle from './EmojiCatcherPuzzle'
import Leaderboard from '../Leaderboard'
import type { EmojiCatcherConfig } from '@/types/games'
import type { Database } from '@/types/database'

type Player = Database['public']['Tables']['players']['Row']

interface EmojiCatcherWithLeaderboardProps {
  sessionId: string
  playerId: string
  players: Player[]
  gameData: EmojiCatcherConfig
  isHost: boolean
  onContinue: () => void
  totalGames?: number
  puzzleIndex?: number
  roomId?: string
  nextGameName?: string
}

export default function EmojiCatcherWithLeaderboard({
  sessionId,
  playerId,
  players,
  gameData,
  isHost,
  onContinue,
  totalGames = 3,
  puzzleIndex = 0,
  roomId,
  nextGameName,
}: EmojiCatcherWithLeaderboardProps) {
  const [isFinished, setIsFinished] = useState(false)
  const [allPlayersFinished, setAllPlayersFinished] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const checkAllFinished = async () => {
      const { data: actions } = await supabase
        .from('player_actions')
        .select('player_id')
        .eq('session_id', sessionId)
        .eq('puzzle_index', puzzleIndex)
        .eq('action_type', 'emoji_catcher_finished')

      if (!actions) return

      const playersFinished = new Set(actions.map((action: any) => action.player_id))
      const allFinished = players.every((player) => playersFinished.has(player.id))
      setAllPlayersFinished(allFinished)
    }

    checkAllFinished()

    let pollInterval: NodeJS.Timeout | null = null
    if (isFinished && !allPlayersFinished) {
      pollInterval = setInterval(checkAllFinished, 2000)
    }

    const channel = supabase
      .channel(`emoji_catcher_completion_${sessionId}`)
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
  }, [sessionId, players, isFinished, allPlayersFinished, puzzleIndex])

  const handleGameComplete = () => {
    setIsFinished(true)
  }

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

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-3xl w-full space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-sm text-center space-y-6">
            <div className="text-6xl">⏳</div>
            <h2 className="text-3xl font-bold text-white">
              Spiel abgeschlossen!
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
            <div className="mt-8 space-y-2">
              {players.map((player) => {
                const isCurrentPlayer = player.id === playerId
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{player.avatar || '👤'}</span>
                      <span className="text-white">
                        {player.name}
                        {isCurrentPlayer && ' (Du)'}
                      </span>
                    </div>
                    <div className="text-green-400">✓</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <EmojiCatcherPuzzle
      sessionId={sessionId}
      playerId={playerId}
      players={players}
      gameData={gameData}
      onComplete={handleGameComplete}
      puzzleIndex={puzzleIndex}
    />
  )
}
```

**Step 2: Verify build**

Run: `cd /Users/dam/dev/grtngs.dana && npx next build --no-lint 2>&1 | tail -10`

**Step 3: Commit**

```bash
git add components/puzzles/EmojiCatcherWithLeaderboard.tsx
git commit -m "feat: add EmojiCatcherWithLeaderboard wrapper component"
```

---

### Task 6: Wire up GameSession routing

**Files:**
- Modify: `app/session/[code]/GameSession.tsx`

**Step 1: Add import**

After the existing CountdownRhythmWithLeaderboard import (line 10), add:

```typescript
import EmojiCatcherWithLeaderboard from '@/components/puzzles/EmojiCatcherWithLeaderboard'
```

**Step 2: Add emoji_catcher case in the game routing**

After the `countdown_rhythm` if-block (around line 605), add:

```typescript
if (game.game_type === 'emoji_catcher') {
  return (
    <EmojiCatcherWithLeaderboard
      sessionId={session.id}
      playerId={currentPlayer.id}
      players={players as any}
      gameData={game.config}
      isHost={isHost}
      onContinue={handlePuzzleComplete}
      totalGames={totalGames}
      puzzleIndex={session.current_puzzle_index}
      roomId={(session.rooms as any)?.id}
      nextGameName={nextGameName}
    />
  )
}
```

**Step 3: Commit**

```bash
git add app/session/[code]/GameSession.tsx
git commit -m "feat: wire up emoji_catcher in GameSession routing"
```

---

### Task 7: Add GameEditor config form

**Files:**
- Modify: `components/GameEditor.tsx`

**Step 1: Add EmojiCatcherConfig import**

Update the import on line 5 to include `EmojiCatcherConfig`:

```typescript
import type { Game, GameType, QuizConfig, MemoryConfig, WordConfig, ChatTypingConfig, CountdownRhythmConfig, EmojiCatcherConfig, QuizQuestion, MemoryPair, WordPuzzle } from '@/types/games'
```

**Step 2: Add config editor rendering**

After the countdown_rhythm block (line 149), add:

```typescript
{gameType === 'emoji_catcher' && (
  <EmojiCatcherConfigEditor config={config as EmojiCatcherConfig} onChange={setConfig} />
)}
```

**Step 3: Add the EmojiCatcherConfigEditor component**

Add at the end of the file (before the last closing):

```typescript
// Emoji Catcher Config Editor
function EmojiCatcherConfigEditor({
  config,
  onChange,
}: {
  config: EmojiCatcherConfig
  onChange: (config: EmojiCatcherConfig) => void
}) {
  const themes = [
    { id: 'animals', name: 'Tiere', icon: '🐶' },
    { id: 'food', name: 'Essen', icon: '🍕' },
    { id: 'sports', name: 'Sport', icon: '⚽' },
    { id: 'party', name: 'Party', icon: '🎉' },
    { id: 'nature', name: 'Natur', icon: '🌸' },
  ] as const

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white">Emoji Catcher Einstellungen</h4>

      {/* Theme Selection */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">Thema</label>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange({ ...config, theme: theme.id })}
              className={`p-3 rounded-lg border-2 transition-all ${
                config.theme === theme.id
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-2xl mb-1">{theme.icon}</div>
              <div className="text-xs text-gray-400">{theme.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Duration */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Spieldauer (Sekunden)</label>
          <input
            type="number"
            value={config.duration}
            onChange={(e) => onChange({ ...config, duration: parseInt(e.target.value) || 45 })}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={15}
            max={120}
          />
          <p className="text-xs text-gray-400 mt-1">15-120 Sekunden</p>
        </div>

        {/* Spawn Rate */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Emojis pro Sekunde</label>
          <input
            type="number"
            value={config.spawnRate}
            onChange={(e) => onChange({ ...config, spawnRate: parseFloat(e.target.value) || 2 })}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0.5}
            max={5}
            step={0.5}
          />
          <p className="text-xs text-gray-400 mt-1">0.5-5 pro Sekunde</p>
        </div>

        {/* Fall Speed */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Fallgeschwindigkeit</label>
          <input
            type="number"
            value={config.fallSpeed}
            onChange={(e) => onChange({ ...config, fallSpeed: parseInt(e.target.value) || 3 })}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={1}
            max={5}
          />
          <p className="text-xs text-gray-400 mt-1">1 (langsam) bis 5 (schnell)</p>
        </div>
      </div>

      <div className="text-xs text-gray-400 bg-blue-500/10 border border-blue-500/20 rounded p-3">
        💡 Die Spieler müssen die richtigen Emojis mit ihrem Korb fangen. Richtige Emojis geben +10 Punkte, falsche -5.
      </div>
    </div>
  )
}
```

**Step 4: Verify build**

Run: `cd /Users/dam/dev/grtngs.dana && npx next build --no-lint 2>&1 | tail -10`

**Step 5: Commit**

```bash
git add components/GameEditor.tsx
git commit -m "feat: add Emoji Catcher config editor in admin panel"
```

---

### Task 8: Manual testing

**Step 1: Start dev server**

Run: `cd /Users/dam/dev/grtngs.dana && npm run dev`

**Step 2: Test in admin panel**

1. Go to `/admin` and log in
2. Create a new game, select "Emoji Catcher"
3. Verify theme selection, duration/speed/spawn config works
4. Save the game, add it to a room's game queue

**Step 3: Test gameplay**

1. Create a session in the room
2. Join as a player
3. Start the game
4. Verify: emojis fall, basket moves with touch/mouse, scoring works
5. Verify: game ends after timer, result screen shows, leaderboard appears

**Step 4: Fix any issues found, commit fixes**

```bash
git add -A
git commit -m "fix: address issues found in emoji catcher manual testing"
```
