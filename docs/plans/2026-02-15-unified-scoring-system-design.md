# Unified Scoring System Design

## Problem

The scoring system has five bugs causing incorrect or missing score display:

1. **Hardcoded puzzle index** in WordWithLeaderboard queries `.eq('puzzle_index', 2)` instead of using the actual `puzzleIndex` prop. Word game scores only appear when it's the 3rd game in the queue.
2. **Score floor applied during calculation** - `Math.max(0, ...)` on every addition masks real intermediate scores. A -2 then +10 yields 10 instead of 8.
3. **Memory game missing completion action** - Leaderboard waits for `memory_complete` action that MemoryPuzzle never inserts.
4. **Chat Typing Race stores scores differently** - Saves one cumulative `chat_typing_finished` action while all other games save per-action points.
5. **No score persistence** - Scores recalculated from `player_actions` on every leaderboard load. The `game_progress.score` field exists but is never written.

## Solution

Extract all scoring logic into a shared `lib/scoring.ts` module. Every game uses the same functions for recording actions and aggregating scores.

### Shared Module: `lib/scoring.ts`

**Score Recording** - One function per action type:
- `recordQuizAnswer(sessionId, playerId, puzzleIndex, data)`
- `recordMemoryAction(sessionId, playerId, puzzleIndex, data)`
- `recordWordAnswer(sessionId, playerId, puzzleIndex, data)`
- `recordChatTypingAnswer(sessionId, playerId, puzzleIndex, data)` - now per-answer, not cumulative
- `recordCountdownStop(sessionId, playerId, puzzleIndex, data)`

**Score Aggregation** - Shared query logic:
- `getLeaderboardScores(sessionId, puzzleIndex)` - scores for one game
- `getFinalScores(sessionId)` - cumulative scores across all games

Key constraint: `puzzleIndex` is always a parameter, never hardcoded.

### Bug Fixes

1. **Dynamic puzzle index** - All WithLeaderboard components pass `puzzleIndex` to scoring functions.
2. **Score floor at display only** - Allow negative intermediate scores during aggregation. Floor to 0 only in the leaderboard UI component.
3. **Memory completion action** - MemoryPuzzle inserts `memory_complete` action when game finishes.
4. **Chat Typing per-action storage** - Store individual `chat_typing_answer` actions for each correct response, consistent with other games.
5. **Persist final scores** - Write cumulative score to `game_progress` table when each game completes.

### Files Changed

| File | Change |
|------|--------|
| `lib/scoring.ts` | New - shared scoring module |
| `components/puzzles/QuizPuzzle.tsx` | Use `recordQuizAnswer` |
| `components/puzzles/MemoryPuzzle.tsx` | Use `recordMemoryAction`, add completion action |
| `components/puzzles/WordPuzzle.tsx` | Use `recordWordAnswer` |
| `components/puzzles/ChatTypingRaceWithLeaderboard.tsx` | Use per-action `recordChatTypingAnswer` |
| `components/puzzles/CountdownRhythmPuzzle.tsx` | Use `recordCountdownStop` |
| `components/puzzles/QuizWithLeaderboard.tsx` | Use `getLeaderboardScores` |
| `components/puzzles/MemoryWithLeaderboard.tsx` | Use `getLeaderboardScores` |
| `components/puzzles/WordWithLeaderboard.tsx` | Use `getLeaderboardScores` (fixes hardcoded index) |
| `components/puzzles/CountdownRhythmWithLeaderboard.tsx` | Use `getLeaderboardScores` |
| `components/Leaderboard.tsx` | Remove inline aggregation, receive pre-calculated scores |
| `components/FinalLeaderboard.tsx` | Use `getFinalScores`, floor to 0 at display |

12 files total. Changes per file are small - replacing inline Supabase queries with function calls.
