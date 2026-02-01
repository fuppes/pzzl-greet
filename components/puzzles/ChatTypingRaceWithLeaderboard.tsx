'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Leaderboard from '@/components/Leaderboard'
import type { ChatTypingConfig } from '@/types/games'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

interface Player {
  id: string
  name: string
  color: string
}

interface ChatMessage {
  id: number
  from: string
  avatar: string
  message: string
  requiredResponse: string
  timestamp: string
  penaltyResponse?: string
}

/* ================= CONFIG ================= */

const PENALTY_TIME_SECONDS = 3
const CORRECT_ANSWER_POINTS = 100
const MESSAGE_DISPLAY_DELAY_MS = 1000
const PENALTY_DISPLAY_DELAY_MS = 500
const PENALTY_DURATION_MS = 2000
const NEXT_MESSAGE_DELAY_MS = 500
const TIMER_INTERVAL_MS = 1000

/* ================= DATA ================= */

const CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    from: 'Oma Ivy',
    avatar: '👵',
    message: 'Hallo Schatz! Ich wünsche dir einen guten Rutsch ins neue Jahr! 🎆',
    requiredResponse: 'Danke Oma, dir auch einen guten Rutsch!',
    timestamp: '23:45',
    penaltyResponse: 'Schatz, ich verstehe dich nicht... 😕',
  },
  {
    id: 2,
    from: 'Mama',
    avatar: '👩',
    message: 'Frohes neues Jahr mein Liebling! 🎉🍾',
    requiredResponse: 'Frohes neues Jahr Mama!',
    timestamp: '00:01',
    penaltyResponse: 'Kannst du nicht richtig schreiben? 🤨',
  },
  {
    id: 3,
    from: 'Papa',
    avatar: '👨',
    message: 'Prosit Neujahr! Auf ein erfolgreiches 2026! 🥂',
    requiredResponse: 'Prost Papa, auf 2026!',
    timestamp: '00:02',
    penaltyResponse: 'Hast du schon zu viel getrunken? 😅',
  },
  {
    id: 4,
    from: 'Bester Kumpel',
    avatar: '😎',
    message: 'Yoooo alter gutes neues! Party heute? 🎊',
    requiredResponse: 'Frohes Neues! Klar, bin dabei!',
    timestamp: '00:05',
    penaltyResponse: 'Digga was schreibst du da? 😂',
  },
  {
    id: 5,
    from: 'Schwester Mica',
    avatar: '👧',
    message: 'Happy New Year Bruderherz! 🎈',
    requiredResponse: 'Dir auch ein frohes neues Jahr!',
    timestamp: '00:10',
    penaltyResponse: 'Hä? Lern mal tippen... 🙄',
  },
  {
    id: 6,
    from: 'Chef',
    avatar: '👔',
    message: 'Guten Rutsch ins neue Jahr! Erholen Sie sich gut. 📧',
    requiredResponse: 'Vielen Dank, Ihnen auch!',
    timestamp: '23:30',
    penaltyResponse: 'Das war unprofessionell. 😐',
  },
  {
    id: 7,
    from: 'Opa Manu',
    avatar: '👴',
    message: 'Na Jung, alles Gute fürs neue Jahr! Bleib gesund! 🎆',
    requiredResponse: 'Danke Opa, du auch!',
    timestamp: '00:15',
    penaltyResponse: 'Was? Ich verstehe nur Bahnhof! 👴',
  },
  {
    id: 8,
    from: 'Tante Jessi',
    avatar: '👩‍🦰',
    message: 'Liebes, ich wünsche dir nur das Beste für 2026! 💝',
    requiredResponse: 'Vielen Dank Tante Jessi!',
    timestamp: '00:20',
    penaltyResponse: 'So eine Antwort hätte ich nicht erwartet... 😤',
  },
  {
    id: 0,
    from: 'Nachbar Thorsten',
    avatar: '👨‍🦳',
    message: 'Guten Rutsch! Und bitte nicht so laut feiern! 😤',
    requiredResponse: 'Danke, wird leise bleiben!',
    timestamp: '23:55',
    penaltyResponse: 'ICH RUFE DIE POLIZEI! 🚨',
  },
  {
    id: 10,
    from: 'Cousin Marc',
    avatar: '🧑‍🎓',
    message: 'Ey Couseng! Frohes neues Jahr! Wann sehen wir uns mal wieder? 🤗',
    requiredResponse: 'Frohes Neues Marc! Bald wieder!',
    timestamp: '00:08',
    penaltyResponse: 'Schreib halt irgendwas... 😑',
  },
  {
    id: 11,
    from: 'Arbeitskollegin Madeline',
    avatar: '💼',
    message: 'Happy New Year! Lass uns 2026 rocken! 🚀',
    requiredResponse: 'Happy New Year Madeline!',
    timestamp: '00:12',
    penaltyResponse: 'Das war wohl nix... 🤦‍♀️',
  },
  {
    id: 12,
    from: 'Onkel Kurt',
    avatar: '👨‍🦲',
    message: 'Prost Neujahr! Komm mal wieder vorbei zum Grillen! 🍖',
    requiredResponse: 'Prost Onkel Kurt! Gerne!',
    timestamp: '00:25',
    penaltyResponse: 'Zu kompliziert für dich? 🙄',
  },
  {
    id: 13,
    from: 'Lena und Dave',
    avatar: '👩🏻‍❤️‍👨🏻',
    message: 'Frohes neues Jahr und nur das Beste für euch!',
    requiredResponse: 'Danke! Ihr seid lowkey die OGs!',
    timestamp: '00:25',
    penaltyResponse: 'Oookay, das hätte man auch anders sagen können.',
  },
  {
    id: 14,
    from: 'Grundschulfreundin Monique',
    avatar: '👱‍♀️',
    message: 'Hey! Lang nix gehört! Frohes neues Jahr! 💕',
    requiredResponse: 'Hey Monique! Dir auch!',
    timestamp: '00:18',
    penaltyResponse: 'Okay... ignorier mich doch lieber als das... 😢',
  },
  {
    id: 15,
    from: 'Bruder',
    avatar: '🧔',
    message: 'Yo Bro! Frohes Neues! Zocken wir morgen? 🎮',
    requiredResponse: 'Frohes Neues! Klar, bin dabei!',
    timestamp: '00:22',
    penaltyResponse: 'Alter, konzentrier dich! 😤',
  },
  {
    id: 16,
    from: 'Fitnesstrainer Adrian',
    avatar: '💪',
    message: 'Happy New Year! Neue Vorsätze? Gym morgen! 🏋️',
    requiredResponse: 'Happy New Year Adrian! Haha, der war gut.',
    timestamp: '00:35',
    penaltyResponse: 'Du bist wohl heute nicht gerade in Topform. 😠',
  },
  {
    id: 17,
    from: 'Vermieter Miro',
    avatar: '🏠',
    message: 'Guten Rutsch! Die Miete bitte pünktlich im neuen Jahr. 💰',
    requiredResponse: 'Guten Rutsch! Wird gemacht!',
    timestamp: '23:50',
    penaltyResponse: 'Ich erwarte eine ordentliche Antwort! 😤',
  },
  {
    id: 18,
    from: 'WG-Mitbewohnerin Marta',
    avatar: '👩‍🎤',
    message: 'HAPPY NEW YEAAAAR!!! Party in 10 min!!! 🎉🥳',
    requiredResponse: 'Bin gleich da!',
    timestamp: '00:28',
    penaltyResponse: 'Beeil dich einfach!! 😫',
  },
  {
    id: 19,
    from: 'Oma Marlene',
    avatar: '👵🏻',
    message: 'Mein Schatz! Hab Stollen gebacken! Komm vorbei! 🍰',
    requiredResponse: 'Danke Oma! Komme bald!',
    timestamp: '23:40',
    penaltyResponse: 'So spricht man nicht mit Oma! 😠',
  },
  {
    id: 20,
    from: 'Freundin Johanna',
    avatar: '🤪',
    message: 'Digga! Frohes Neues! Raketen sind gezündet! 🎆🚀',
    requiredResponse: 'Frohes Neues, Diggi',
    timestamp: '00:03',
    penaltyResponse: 'Was is los mit dir alter?? 🤨',
  },
]

/* ================= TYPES ================= */

type PlayerActionInsert = Database['public']['Tables']['player_actions']['Insert']

type ThreadItem =
  | { type: 'incoming'; msg: ChatMessage; pending?: boolean }
  | { type: 'outgoing'; msg: ChatMessage; text: string }
  | { type: 'penalty'; msg: ChatMessage }

type Thread = {
  key: string
  avatar: string
  items: ThreadItem[]
}

/* ================= COMPONENT ================= */

export default function ChatTypingRaceWithLeaderboard({
  sessionId,
  players,
  playerId,
  config,
  isHost,
  onContinue,
  totalGames,
  puzzleIndex,
  nextGameName,
}: {
  sessionId: string
  players: Player[]
  playerId: string
  config: ChatTypingConfig
  isHost: boolean
  onContinue?: () => void
  totalGames?: number
  puzzleIndex?: number
  nextGameName?: string
}) {
  const GAME_DURATION = config.duration || 60
  const [showInstructions, setShowInstructions] = useState(true)

  const [currentMessage, setCurrentMessage] = useState<ChatMessage | null>(null)
  const [activeThreadKey, setActiveThreadKey] = useState<string>('')
  const [typedText, setTypedText] = useState('')
  const [gameFinished, setGameFinished] = useState(false)
  const [allPlayersFinished, setAllPlayersFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [messagesAnswered, setMessagesAnswered] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [showingPenalty, setShowingPenalty] = useState(false)
  const [threads, setThreads] = useState<Record<string, Thread>>({})

  const inputRef = useRef<HTMLInputElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const inputBarRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const penaltyTimerRef = useRef<NodeJS.Timeout | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Keep track whether user is "near bottom" in the chat area.
  const stickToBottomRef = useRef(true)

  const threadList = useMemo(() => {
    return Object.values(threads).sort((a, b) => a.key.localeCompare(b.key))
  }, [threads])

  const activeThread = activeThreadKey ? threads[activeThreadKey] : undefined

  /* ================= FOCUS: keep input focused ================= */

  const forceFocus = useCallback(() => {
    // don't steal focus when game finished
    if (gameFinished) return
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true })
    })
  }, [gameFinished])

  // Re-focus after thread changes or current message changes
  useEffect(() => {
    forceFocus()
  }, [activeThreadKey, currentMessage, forceFocus])

  // If user taps somewhere, immediately bounce focus back to input.
  const handleContainerPointerDown = useCallback(() => {
    forceFocus()
  }, [forceFocus])

  /* ================= SCROLL: only if user is near bottom ================= */

  const updateStickToBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const thresholdPx = 80
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceFromBottom <= thresholdPx
  }, [])

  const scrollToBottomIfSticky = useCallback(() => {
    if (!stickToBottomRef.current) return
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      }
    })
  }, [])

  /* ================= TIMER ================= */

  const finishGame = useCallback(async () => {
    setGameFinished(true)

    // optional legacy: wenn du irgendwann wieder „warte auf alle“ willst
    if (players.length <= 1) {
      setAllPlayersFinished(true)
    }

    const supabase = createClient() as SupabaseClient<Database>

    const payload: PlayerActionInsert = {
      session_id: sessionId,
      player_id: playerId,
      puzzle_index: puzzleIndex ?? 0, // ✅ FIX: nicht hardcoded 0
      action_type: 'chat_typing_finished',
      data: { points: totalPoints },
    }

    await (supabase.from('player_actions') as any).insert(payload as any)

    if (timerRef.current) clearInterval(timerRef.current)
    if (penaltyTimerRef.current) clearTimeout(penaltyTimerRef.current)
  }, [players.length, sessionId, playerId, totalPoints, puzzleIndex])

  useEffect(() => {
    if (showInstructions) return // ✅ FIX: Timer erst nach Start
    if (gameFinished) return

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          finishGame()
          return 0
        }
        return t - 1
      })
    }, TIMER_INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [showInstructions, gameFinished, finishGame])

  /* ================= AUTO SCROLL INPUT (horizontal) ================= */

  useEffect(() => {
    if (!inputRef.current || !currentMessage) return

    // Calculate scroll position based on typed text length
    const charWidth = 9.6 // Average monospace char width at 16px
    const currentPos = typedText.length * charWidth
    const containerWidth = inputContainerRef.current?.clientWidth || 0

    // Scroll to keep current position centered
    if (inputContainerRef.current) {
      const scrollLeft = Math.max(0, currentPos - containerWidth / 2)
      inputContainerRef.current.scrollLeft = scrollLeft
    }
  }, [typedText, currentMessage])

  /* ================= THREAD HELPERS ================= */

  const ensureThread = useCallback((msg: ChatMessage) => {
    setThreads((prev) => {
      if (prev[msg.from]) return prev
      return {
        ...prev,
        [msg.from]: {
          key: msg.from,
          avatar: msg.avatar,
          items: [],
        },
      }
    })
  }, [])

  const appendToThread = useCallback((threadKey: string, item: ThreadItem) => {
    setThreads((prev) => {
      const existing =
        prev[threadKey] ?? { key: threadKey, avatar: '💬', items: [] }
      return {
        ...prev,
        [threadKey]: {
          ...existing,
          items: [...existing.items, item],
        },
      }
    })
  }, [])

  const replacePendingIncoming = useCallback((threadKey: string, msgId: number) => {
    setThreads((prev) => {
      const t = prev[threadKey]
      if (!t) return prev
      return {
        ...prev,
        [threadKey]: {
          ...t,
          items: t.items.map((it) =>
            it.type === 'incoming' && it.pending && it.msg.id === msgId
              ? { type: 'incoming', msg: it.msg, pending: false }
              : it
          ),
        },
      }
    })
  }, [])

  /* ================= RANDOM / ROTATION ================= */

  const lastSenderRef = useRef<string>('')

  const getRandomMessageRotating = useCallback((): ChatMessage => {
    if (CHAT_MESSAGES.length === 1) return CHAT_MESSAGES[0]

    for (let tries = 0; tries < 8; tries++) {
      const msg = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)]
      if (msg.from !== lastSenderRef.current) return msg
    }
    return CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)]
  }, [])

  /* ================= MESSAGE FLOW ================= */

  const showNextMessage = useCallback(() => {
    const msg = getRandomMessageRotating()
    lastSenderRef.current = msg.from

    ensureThread(msg)

    setActiveThreadKey(msg.from)
    setCurrentMessage(msg)
    setTypedText('')

    // pending incoming at bottom
    appendToThread(msg.from, { type: 'incoming', msg, pending: true })
    scrollToBottomIfSticky()
    forceFocus()

    // pending -> real
    setTimeout(() => {
      replacePendingIncoming(msg.from, msg.id)
      scrollToBottomIfSticky()
      forceFocus()
    }, MESSAGE_DISPLAY_DELAY_MS)
  }, [
    appendToThread,
    ensureThread,
    forceFocus,
    getRandomMessageRotating,
    replacePendingIncoming,
    scrollToBottomIfSticky,
  ])

  useEffect(() => {
    if (!showInstructions) {
      showNextMessage()
    }
  }, [showInstructions, showNextMessage])

  /* ================= ANSWER ================= */

  const checkAnswer = async () => {
    if (!currentMessage || gameFinished || showingPenalty) return
    if (!activeThreadKey) return

    const required = currentMessage.requiredResponse
    const correct = typedText.trim().toLowerCase() === required.toLowerCase()

    appendToThread(activeThreadKey, {
      type: 'outgoing',
      msg: currentMessage,
      text: typedText,
    })
    scrollToBottomIfSticky()
    forceFocus()

    if (!correct) {
      setShowingPenalty(true)

      setTimeout(() => {
        appendToThread(activeThreadKey, { type: 'penalty', msg: currentMessage })
        scrollToBottomIfSticky()
        setTimeLeft((t) => Math.max(0, t - PENALTY_TIME_SECONDS))

        penaltyTimerRef.current = setTimeout(() => {
          setShowingPenalty(false)
          if (!gameFinished && timeLeft > 0) showNextMessage()
        }, PENALTY_DURATION_MS)
      }, PENALTY_DISPLAY_DELAY_MS)

      return
    }

    setTotalPoints((p) => p + CORRECT_ANSWER_POINTS)
    setMessagesAnswered((c) => c + 1)

    setTimeout(showNextMessage, NEXT_MESSAGE_DELAY_MS)
  }

  /* ================= LEADERBOARD ================= */

  // ✅ FIX: sobald das Spiel vorbei ist -> Leaderboard anzeigen
  if (gameFinished || allPlayersFinished) {
    return (
      <Leaderboard
        sessionId={sessionId}
        players={players as any}
        currentPlayerId={playerId}
        isHost={isHost}
        onContinue={onContinue}
        puzzleIndex={puzzleIndex || 0}
        totalGames={totalGames || 1}
        nextGameName={nextGameName}
      />
    )
  }

  /* ================= INSTRUCTIONS SCREEN ================= */

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💬</span>
            <div>
              <h1 className="text-white text-xl font-bold">Chat Typing Race</h1>
              <p className="text-slate-300 text-sm">
                Tippe Antworten so schnell & exakt wie möglich.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 mb-5">
            <p className="text-slate-200">
              Du bekommst Nachrichten in wechselnden Chats. Tippe die{' '}
              <span className="font-semibold">vorgegebene</span> Antwort und drücke{' '}
              <span className="font-semibold">Enter</span>.
            </p>

            <ul className="text-slate-300 text-sm space-y-2 mt-3 list-disc pl-5">
              <li>
                ⏱ Zeit:{' '}
                <span className="text-white/90 font-semibold">{GAME_DURATION}s</span>
              </li>
              <li>
                ✅ Richtige Antwort:{' '}
                <span className="text-white/90 font-semibold">
                  +{CORRECT_ANSWER_POINTS}
                </span>{' '}
                Punkte
              </li>
              <li>
                ❌ Falsch:{' '}
                <span className="text-white/90 font-semibold">
                  -{PENALTY_TIME_SECONDS}s
                </span>{' '}
                Zeitstrafe
              </li>
              <li>Der aktive Chat wird automatisch gewechselt.</li>
              <li>Groß-/Kleinschreibung ist egal, der Rest muss matchen.</li>
            </ul>
          </div>

          <button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-95 active:opacity-90"
            onClick={() => setShowInstructions(false)}
          >
            Spiel starten ▶
          </button>

          <p className="text-xs text-slate-400 mt-3">
            Tipp: Klick irgendwo rein – das Input bleibt während des Spiels automatisch fokussiert.
          </p>
        </div>
      </div>
    )
  }

  /* ================= UI ================= */

  return (
    <div
      className="min-h-screen bg-slate-900 flex items-center justify-center p-2"
      onPointerDown={handleContainerPointerDown}
    >
      <div className="w-full max-w-none sm:max-w-3xl h-[92vh] bg-slate-800 rounded-xl flex flex-col">
        {/* HEADER */}
        <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 flex justify-between items-center shrink-0">
          <span className="text-white font-bold">💬 Chat Typing Race</span>
          <div className="flex items-center gap-3">
            <span className="text-white/90 font-semibold text-sm">🏆 {totalPoints}</span>
            <span className="text-white font-bold">⏱ {timeLeft}s</span>
          </div>
        </div>

        {/* THREAD INDICATOR (auto-switched) */}
        <div className="border-b border-slate-700 px-2 py-2 overflow-x-auto shrink-0">
          <div className="flex gap-2 min-w-max pointer-events-none">
            {threadList.length === 0 ? (
              <div className="text-xs text-gray-400 px-2">Chats laden…</div>
            ) : (
              threadList.map((t) => {
                const active = t.key === activeThreadKey
                return (
                  <div
                    key={t.key}
                    className={[
                      'flex items-center gap-2 px-3 py-2 rounded-full border text-sm',
                      active
                        ? 'bg-white/15 border-white/20 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 opacity-70',
                    ].join(' ')}
                  >
                    <span className="text-lg">{t.avatar}</span>
                    <span className="font-medium">{t.key}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* CHAT AREA (messages at bottom) */}
        <div
          ref={scrollContainerRef}
          onScroll={updateStickToBottom}
          className="flex-1 overflow-y-auto px-3 py-4 bg-slate-900 min-h-0"
        >
          <div className="min-h-full flex flex-col justify-end">
            <div className="space-y-3">
              {(activeThread?.items ?? []).map((it, idx) => {
                if (it.type === 'incoming') {
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="text-3xl">{it.msg.avatar}</div>
                      <div className="max-w-[85%]">
                        <div className="text-xs text-gray-400 mb-1">
                          {it.msg.from} · {it.msg.timestamp}
                        </div>
                        <div className="bg-slate-700 rounded-2xl rounded-tl-none px-3 py-2 text-white">
                          {it.pending ? (
                            <span className="inline-flex items-center gap-2 text-white/80">
                              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
                              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:120ms]" />
                              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:240ms]" />
                            </span>
                          ) : (
                            it.msg.message
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }

                if (it.type === 'penalty') {
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="text-3xl">{it.msg.avatar}</div>
                      <div className="max-w-[85%]">
                        <div className="bg-red-600/80 border border-red-400 rounded-2xl rounded-tl-none px-3 py-2 text-white font-semibold">
                          {it.msg.penaltyResponse ?? 'Falsch!'}
                        </div>
                        <div className="text-xs text-red-300 mt-1">
                          ⚠️ -{PENALTY_TIME_SECONDS}s Zeitstrafe
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={idx} className="flex justify-end">
                    <div className="max-w-[85%]">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl rounded-tr-none px-3 py-2 text-white font-mono break-words">
                        {it.text}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 text-right">✓ gesendet</div>
                    </div>
                  </div>
                )
              })}

              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        {/* INPUT BAR (always visible, focus stays here) */}
        {!gameFinished && currentMessage && (
          <div ref={inputBarRef} className="bg-slate-800 border-t border-slate-700 p-3 shrink-0">
            <div
              ref={inputContainerRef}
              className="relative bg-slate-700 rounded-xl overflow-x-auto"
            >
              {/* GHOST */}
              <div className="typing-race-text text-white/30 absolute top-0 left-0 pointer-events-none">
                {currentMessage.requiredResponse.split('').map((char, i) => (
                  <span
                    key={i}
                    className={i < typedText.length ? 'opacity-0' : ''}
                  >
                    {char}
                  </span>
                ))}
              </div>

              {/* INPUT */}
              <input
                ref={inputRef}
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && typedText.trim()) checkAnswer()
                }}
                onBlur={() => forceFocus()}
                className="typing-race-text w-full bg-transparent text-white relative z-10"
                autoFocus
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>
                Aktiver Chat: <span className="text-white/80">{activeThreadKey || '—'}</span>
              </span>
              <span>{messagesAnswered} beantwortet</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
