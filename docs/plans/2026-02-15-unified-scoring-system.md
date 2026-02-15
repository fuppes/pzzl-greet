# Unified Scoring System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 5 scoring bugs by extracting scoring logic into a shared module with consistent puzzle index handling and score aggregation.

**Architecture:** Create `lib/scoring.ts` as a single source of truth for recording player actions and aggregating scores. All puzzle components call recording functions; all leaderboard components call aggregation functions. The `puzzleIndex` is always passed as a parameter, never hardcoded.

**Tech Stack:** Next.js 15, React 19, Supabase (client-side), TypeScript

---

### Task 1: Fix hardcoded puzzle_index in MemoryPuzzle

The most critical bug alongside the Word game. MemoryPuzzle hardcodes `puzzle_index: 1` in 4 places (flip, match, mismatch actions and subscription filter). It needs a `puzzleIndex` prop.

**Files:**
- Modify: `components/puzzles/MemoryPuzzle.tsx`
- Modify: `components/puzzles/MemoryWithLeaderboard.tsx`

**Step 1: Add puzzleIndex prop to MemoryPuzzle**

In `components/puzzles/MemoryPuzzle.tsx`, add `puzzleIndex` to the interface:

```typescript
interface MemoryPuzzleProps {
  sessionId: string
  playerId: string
  players: Player[]
  memoryData: MemoryGameData
  onComplete: () => void
  puzzleIndex?: number  // ADD THIS
}
```

Destructure it with default:
```typescript
export default function MemoryPuzzle({
  sessionId,
  playerId,
  players,
  memoryData,
  onComplete,
  puzzleIndex = 0,  // ADD THIS
}: MemoryPuzzleProps) {
```

**Step 2: Replace all hardcoded puzzle_index: 1**

In the subscription filter (line 56):
```typescript
// BEFORE:
if (action.action_type === 'memory_flip' && action.puzzle_index === 1) {
// AFTER:
if (action.action_type === 'memory_flip' && action.puzzle_index === puzzleIndex) {
```

```typescript
// BEFORE:
} else if (action.action_type === 'memory_match' && action.puzzle_index === 1) {
// AFTER:
} else if (action.action_type === 'memory_match' && action.puzzle_index === puzzleIndex) {
```

In the flip insert (line 95):
```typescript
// BEFORE:
puzzle_index: 1,
// AFTER:
puzzle_index: puzzleIndex,
```

In the match insert (line 121):
```typescript
// BEFORE:
puzzle_index: 1,
// AFTER:
puzzle_index: puzzleIndex,
```

In the mismatch insert (line 139):
```typescript
// BEFORE:
puzzle_index: 1,
// AFTER:
puzzle_index: puzzleIndex,
```

Add `puzzleIndex` to the subscription useEffect dependency array (line 70):
```typescript
}, [sessionId, puzzleIndex])
```

**Step 3: Pass puzzleIndex from MemoryWithLeaderboard**

In `components/puzzles/MemoryWithLeaderboard.tsx`, pass `puzzleIndex` to `MemoryPuzzle` (around line 155):

```typescript
<MemoryPuzzle
  sessionId={sessionId}
  playerId={playerId}
  players={players}
  memoryData={memoryGameData}
  onComplete={handleMemoryComplete}
  puzzleIndex={puzzleIndex}  // ADD THIS
/>
```

**Step 4: Build to verify**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

**Step 5: Commit**

```bash
git add components/puzzles/MemoryPuzzle.tsx components/puzzles/MemoryWithLeaderboard.tsx
git commit -m "fix: use dynamic puzzleIndex in MemoryPuzzle instead of hardcoded 1"
```

---

### Task 2: Fix hardcoded puzzle_index in WordPuzzle

WordPuzzle hardcodes `puzzle_index: 2` in the action insert and subscription filter. WordWithLeaderboard also hardcodes it in the completion check query. WordPuzzle needs a `puzzleIndex` prop.

**Files:**
- Modify: `components/puzzles/WordPuzzle.tsx`
- Modify: `components/puzzles/WordWithLeaderboard.tsx`

**Step 1: Add puzzleIndex prop to WordPuzzle**

In `components/puzzles/WordPuzzle.tsx`, add `puzzleIndex` to the interface:

```typescript
interface WordPuzzleProps {
  sessionId: string
  playerId: string
  players: Player[]
  wordData: WordGameData
  onComplete: () => void
  puzzleIndex?: number  // ADD THIS
}
```

Destructure it:
```typescript
export default function WordPuzzle({
  sessionId,
  playerId,
  players,
  wordData,
  onComplete,
  puzzleIndex = 0,  // ADD THIS
}: WordPuzzleProps) {
```

**Step 2: Replace hardcoded puzzle_index: 2 in WordPuzzle**

In the subscription filter (line 117):
```typescript
// BEFORE:
action.puzzle_index === 2 &&
// AFTER:
action.puzzle_index === puzzleIndex &&
```

In the action insert (line 172):
```typescript
// BEFORE:
puzzle_index: 2,
// AFTER:
puzzle_index: puzzleIndex,
```

Add `puzzleIndex` to subscription useEffect dependency array (line 143):
```typescript
}, [sessionId, currentWordIndex, players, showInstructions, puzzleIndex])
```

**Step 3: Fix hardcoded puzzle_index in WordWithLeaderboard**

In `components/puzzles/WordWithLeaderboard.tsx`, line 49:
```typescript
// BEFORE:
.eq('puzzle_index', 2)
// AFTER:
.eq('puzzle_index', puzzleIndex)
```

**Step 4: Pass puzzleIndex to WordPuzzle from WordWithLeaderboard**

Around line 159:
```typescript
<WordPuzzle
  sessionId={sessionId}
  playerId={playerId}
  players={players}
  wordData={wordGameData}
  onComplete={handleWordComplete}
  puzzleIndex={puzzleIndex}  // ADD THIS
/>
```

**Step 5: Build to verify**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

**Step 6: Commit**

```bash
git add components/puzzles/WordPuzzle.tsx components/puzzles/WordWithLeaderboard.tsx
git commit -m "fix: use dynamic puzzleIndex in WordPuzzle instead of hardcoded 2"
```

---

### Task 3: Create shared scoring module

Create `lib/scoring.ts` with score aggregation functions used by all leaderboard components.

**Files:**
- Create: `lib/scoring.ts`

**Step 1: Create the scoring module**

```typescript
import { createClient } from '@/lib/supabase/client'

const SCORING_ACTION_TYPES = [
  'quiz_answer',
  'memory_match',
  'memory_mismatch',
  'word_answer',
  'chat_typing_finished',
  'countdown_rhythm_stop',
] as const

export interface PlayerScoreData {
  playerId: string
  score: number
  actionCount: number
}

/**
 * Get aggregated scores for a specific puzzle (game) in a session.
 * Scores can go negative during calculation; floor to 0 at display.
 */
export async function getLeaderboardScores(
  sessionId: string,
  puzzleIndex: number
): Promise<Record<string, PlayerScoreData>> {
  const supabase = createClient()

  const { data: actions } = await supabase
    .from('player_actions')
    .select('*')
    .eq('session_id', sessionId)
    .lte('puzzle_index', puzzleIndex)
    .in('action_type', [...SCORING_ACTION_TYPES])

  const scores: Record<string, PlayerScoreData> = {}

  if (!actions) return scores

  actions.forEach((action: any) => {
    const data = action.data as any
    if (!scores[action.player_id]) {
      scores[action.player_id] = { playerId: action.player_id, score: 0, actionCount: 0 }
    }
    const points = data.points || 0
    scores[action.player_id].score += points
    scores[action.player_id].actionCount += 1
  })

  return scores
}

/**
 * Get cumulative scores across ALL puzzles in a session.
 * Used by FinalLeaderboard.
 */
export async function getFinalScores(
  sessionId: string
): Promise<Record<string, PlayerScoreData>> {
  const supabase = createClient()

  const { data: actions } = await supabase
    .from('player_actions')
    .select('*')
    .eq('session_id', sessionId)
    .in('action_type', [...SCORING_ACTION_TYPES])

  const scores: Record<string, PlayerScoreData> = {}

  if (!actions) return scores

  actions.forEach((action: any) => {
    const data = action.data as any
    if (!scores[action.player_id]) {
      scores[action.player_id] = { playerId: action.player_id, score: 0, actionCount: 0 }
    }
    const points = data.points || 0
    scores[action.player_id].score += points
    scores[action.player_id].actionCount += 1
  })

  return scores
}

/**
 * Floor a score to 0 for display purposes.
 * Call this only at the UI layer, not during aggregation.
 */
export function displayScore(score: number): number {
  return Math.max(0, score)
}
```

**Step 2: Build to verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add lib/scoring.ts
git commit -m "feat: add shared scoring module for consistent score aggregation"
```

---

### Task 4: Update Leaderboard to use scoring module

Replace inline score aggregation in Leaderboard.tsx with the shared module. Apply score floor only at display.

**Files:**
- Modify: `components/Leaderboard.tsx`

**Step 1: Import scoring module**

Add at top of file:
```typescript
import { getLeaderboardScores, displayScore } from '@/lib/scoring'
```

**Step 2: Replace loadScores function**

Replace the `loadScores` function body (lines 68-115) with:

```typescript
const loadScores = async () => {
  const scores = await getLeaderboardScores(sessionId, puzzleIndex)

  const playerScoresData: PlayerScore[] = players.map((player) => {
    const playerData = scores[player.id]
    return {
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color || '#3b82f6',
      score: displayScore(playerData?.score ?? 0),
      isFinished: true,
    }
  })

  playerScoresData.sort((a, b) => b.score - a.score)

  setPlayerScores(playerScoresData)
  setIsLoading(false)
}
```

Remove the now-unused import if `logError` was only used elsewhere — check first. Keep the Supabase realtime subscription logic as-is (it just triggers `loadScores()` on changes).

**Step 3: Build to verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/Leaderboard.tsx
git commit -m "refactor: use shared scoring module in Leaderboard component"
```

---

### Task 5: Update FinalLeaderboard to use scoring module

Replace inline score aggregation in FinalLeaderboard.tsx with the shared module. Apply score floor only at display.

**Files:**
- Modify: `components/FinalLeaderboard.tsx`

**Step 1: Import scoring module**

Add at top of file:
```typescript
import { getFinalScores, displayScore } from '@/lib/scoring'
```

**Step 2: Replace loadScores function**

Replace the `loadScores` function body (lines 40-92) with:

```typescript
const loadScores = async () => {
  const scores = await getFinalScores(sessionId)

  const playerScoresData: PlayerScore[] = players.map((player) => {
    const playerData = scores[player.id]
    return {
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color || '#3b82f6',
      score: displayScore(playerData?.score ?? 0),
    }
  })

  playerScoresData.sort((a, b) => b.score - a.score)

  setPlayerScores(playerScoresData)
  setIsLoading(false)

  // Check achievements for current player
  // Still need raw actions for achievement checks
  const supabase = createClient()
  const { data: actions } = await supabase
    .from('player_actions')
    .select('*')
    .eq('session_id', sessionId)
    .in('action_type', [
      'quiz_answer',
      'memory_match',
      'memory_mismatch',
      'word_answer',
      'chat_typing_finished',
      'countdown_rhythm_stop'
    ])

  if (actions) {
    const earnedAchievements = checkAchievements(actions, players, currentPlayerId)
    setAchievements(earnedAchievements)
  }
}
```

**Step 3: Build to verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/FinalLeaderboard.tsx
git commit -m "refactor: use shared scoring module in FinalLeaderboard component"
```

---

### Task 6: Build and manual verification

**Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 2: Final commit if any remaining changes**

```bash
git add -A
git commit -m "chore: unified scoring system complete"
```
