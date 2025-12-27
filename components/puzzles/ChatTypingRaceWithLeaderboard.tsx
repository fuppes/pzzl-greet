'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Leaderboard from '@/components/Leaderboard'
import type { ChatTypingConfig } from '@/types/games'

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

const CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    from: 'Oma Inge',
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
    message: 'Prosit Neujahr! Auf ein erfolgreiches 2025! 🥂',
    requiredResponse: 'Prost Papa, auf 2025!',
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
    from: 'Schwester',
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
    from: 'Opa Werner',
    avatar: '👴',
    message: 'Na Jung, alles Gute fürs neue Jahr! Bleib gesund! 🎆',
    requiredResponse: 'Danke Opa, du auch!',
    timestamp: '00:15',
    penaltyResponse: 'Was? Ich verstehe nur Bahnhof! 👴',
  },
  {
    id: 8,
    from: 'Tante Helga',
    avatar: '👩‍🦰',
    message: 'Liebes, ich wünsche dir nur das Beste für 2025! 💝',
    requiredResponse: 'Vielen Dank Tante Helga!',
    timestamp: '00:20',
    penaltyResponse: 'So eine Antwort hätte ich nicht erwartet... 😤',
  },
  {
    id: 9,
    from: 'Ex-Freundin',
    avatar: '💔',
    message: 'Hey... frohes neues Jahr... 🥺',
    requiredResponse: 'Dir auch alles Gute!',
    timestamp: '00:30',
    penaltyResponse: 'Typisch. Kannst es einfach nicht. 😒',
  },
  {
    id: 10,
    from: 'Nachbar Klaus',
    avatar: '👨‍🦳',
    message: 'Guten Rutsch! Und bitte nicht so laut feiern! 😤',
    requiredResponse: 'Danke, wird leise bleiben!',
    timestamp: '23:55',
    penaltyResponse: 'ICH RUFE DIE POLIZEI! 🚨',
  },
  {
    id: 11,
    from: 'Cousin Tobias',
    avatar: '🧑‍🎓',
    message: 'Ey Couseng! Frohes neues Jahr! Wann sehen wir uns mal wieder? 🤗',
    requiredResponse: 'Frohes Neues Tobi! Bald wieder!',
    timestamp: '00:08',
    penaltyResponse: 'Schreib halt irgendwas... 😑',
  },
  {
    id: 12,
    from: 'Arbeitskollegin Sarah',
    avatar: '💼',
    message: 'Happy New Year! Lass uns 2025 rocken! 🚀',
    requiredResponse: 'Happy New Year Sarah!',
    timestamp: '00:12',
    penaltyResponse: 'Das war wohl nix... 🤦‍♀️',
  },
  {
    id: 13,
    from: 'Onkel Rudi',
    avatar: '👨‍🦲',
    message: 'Prost Neujahr! Komm mal wieder vorbei zum Grillen! 🍖',
    requiredResponse: 'Prost Onkel Rudi! Gerne!',
    timestamp: '00:25',
    penaltyResponse: 'Zu kompliziert für dich? 🙄',
  },
  {
    id: 14,
    from: 'Grundschulfreundin Lisa',
    avatar: '👱‍♀️',
    message: 'Hey! Lang nix gehört! Frohes neues Jahr! 💕',
    requiredResponse: 'Hey Lisa! Dir auch!',
    timestamp: '00:18',
    penaltyResponse: 'Okay... ignorier mich halt... 😢',
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
    from: 'Fitnesstrainer Mike',
    avatar: '💪',
    message: 'Happy New Year! Neue Vorsätze? Gym morgen! 🏋️',
    requiredResponse: 'Happy New Year Mike!',
    timestamp: '00:35',
    penaltyResponse: 'Die Form heute ist unterirdisch! 😠',
  },
  {
    id: 17,
    from: 'Vermieter Müller',
    avatar: '🏠',
    message: 'Guten Rutsch! Die Miete bitte pünktlich im neuen Jahr. 💰',
    requiredResponse: 'Guten Rutsch! Wird gemacht!',
    timestamp: '23:50',
    penaltyResponse: 'Ich erwarte eine ordentliche Antwort! 😤',
  },
  {
    id: 18,
    from: 'WG-Mitbewohnerin Anna',
    avatar: '👩‍🎤',
    message: 'HAPPY NEW YEAAAAR!!! Party in 10 min!!! 🎉🥳',
    requiredResponse: 'Bin gleich da!',
    timestamp: '00:28',
    penaltyResponse: 'Beeil dich einfach!! 😫',
  },
  {
    id: 19,
    from: 'Oma Frieda',
    avatar: '👵🏻',
    message: 'Mein Schatz! Hab Stollen gebacken! Komm vorbei! 🍰',
    requiredResponse: 'Danke Oma! Komme bald!',
    timestamp: '23:40',
    penaltyResponse: 'So spricht man nicht mit Oma! 😠',
  },
  {
    id: 20,
    from: 'Kumpel Max',
    avatar: '🤪',
    message: 'BRUUUUUDI! Frohes Neues! Raketen sind gezündet! 🎆🚀',
    requiredResponse: 'BRUUUUDI! Frohes Neues!',
    timestamp: '00:03',
    penaltyResponse: 'Was is los mit dir alter?? 🤨',
  },
]

const PENALTY_TIME = 3

export default function ChatTypingRaceWithLeaderboard({
  sessionId,
  players,
  playerId,
  config,
  isHost,
  onContinue,
}: {
  sessionId: string
  players: Player[]
  playerId: string
  config: ChatTypingConfig
  isHost: boolean
  onContinue?: () => void
}) {
  const GAME_DURATION = config.duration || 60
  const [currentMessage, setCurrentMessage] = useState<ChatMessage | null>(null)
  const [typedText, setTypedText] = useState('')
  const [gameFinished, setGameFinished] = useState(false)
  const [allPlayersFinished, setAllPlayersFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [messagesAnswered, setMessagesAnswered] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [showingIncoming, setShowingIncoming] = useState(false)
  const [showingPenalty, setShowingPenalty] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'incoming' | 'outgoing' | 'penalty'; message: ChatMessage; actualResponse?: string; fadeOut?: boolean }>>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const penaltyTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clearChatTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Start game automatically
  useEffect(() => {
    showNextMessage()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, showingIncoming, showingPenalty])

  useEffect(() => {
    if (gameFinished) return

    const supabase = createClient()

    const checkAllFinished = async () => {
      const { data: actions } = await supabase
        .from('player_actions')
        .select('player_id, data')
        .eq('session_id', sessionId)
        .eq('action_type', 'chat_typing_finished')

      if (!actions) return

      const finishedPlayers = new Set(actions.map((a: any) => a.player_id))
      const allFinished = players.every((p) => finishedPlayers.has(p.id))

      setAllPlayersFinished(allFinished)
    }

    checkAllFinished()

    const channel = supabase
      .channel(`chat-typing-${sessionId}`)
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
      supabase.removeChannel(channel)
    }
  }, [sessionId, players, gameFinished])

  useEffect(() => {
    if (gameFinished || timeLeft <= 0) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameFinished, timeLeft])

  const getRandomMessage = () => {
    return CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)]
  }

  const showNextMessage = () => {
    // Trigger fade-out for old messages
    setChatHistory((prev) => prev.map(item => ({ ...item, fadeOut: true })))

    // Clear old messages after fade-out
    clearChatTimerRef.current = setTimeout(() => {
      setChatHistory([])
    }, 300)

    // Show new message
    const newMessage = getRandomMessage()
    setCurrentMessage(newMessage)
    setShowingIncoming(true)
    setTypedText('')

    setTimeout(() => {
      setChatHistory([{ type: 'incoming', message: newMessage }])
      setShowingIncoming(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 1000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showingIncoming || showingPenalty) return
    setTypedText(e.target.value)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && typedText.trim()) {
      checkAnswer()
    }
  }

  const checkAnswer = async () => {
    if (!currentMessage || showingPenalty) return

    const isCorrect = typedText.trim().toLowerCase() === currentMessage.requiredResponse.toLowerCase()

    if (!isCorrect) {
      setShowingPenalty(true)

      setChatHistory((prev) => [
        ...prev,
        { type: 'outgoing', message: currentMessage, actualResponse: typedText },
      ])

      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          { type: 'penalty', message: currentMessage },
        ])

        setTimeLeft((prev) => Math.max(0, prev - PENALTY_TIME))

        penaltyTimerRef.current = setTimeout(() => {
          setShowingPenalty(false)
          if (timeLeft > 0) {
            showNextMessage()
          }
        }, 2000)
      }, 500)

      return
    }

    setChatHistory((prev) => [
      ...prev,
      { type: 'outgoing', message: currentMessage, actualResponse: typedText },
    ])

    const points = 100
    setTotalPoints((prev) => prev + points)
    setMessagesAnswered((prev) => prev + 1)

    const supabase = createClient()
    await (supabase.from('player_actions') as any).insert({
      session_id: sessionId,
      player_id: playerId,
      puzzle_index: 0,
      action_type: 'chat_message_sent',
      data: {
        messageId: currentMessage.id,
        points,
        correct: true,
      },
    })

    setTimeout(() => showNextMessage(), 500)
  }

  const finishGame = async () => {
    setGameFinished(true)

    const supabase = createClient()
    await (supabase.from('player_actions') as any).insert({
      session_id: sessionId,
      player_id: playerId,
      puzzle_index: 0,
      action_type: 'chat_typing_finished',
      data: {
        totalTime: GAME_DURATION - timeLeft,
        points: totalPoints,
        messagesCompleted: messagesAnswered,
      },
    })

    // Cleanup all timers
    if (timerRef.current) clearInterval(timerRef.current)
    if (penaltyTimerRef.current) clearTimeout(penaltyTimerRef.current)
    if (clearChatTimerRef.current) clearTimeout(clearChatTimerRef.current)
  }

  if (allPlayersFinished) {
    return (
      <Leaderboard
        sessionId={sessionId}
        players={players}
        playerId={playerId}
        isHost={isHost}
        onContinue={onContinue}
        puzzleIndex={0}
        totalGames={1}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full h-[700px] bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">💬</div>
            <div>
              <h3 className="text-white font-bold">Silvester Nachrichten</h3>
              <p className="text-blue-100 text-sm">{messagesAnswered} beantwortet</p>
            </div>
          </div>
          {!gameFinished && (
            <div className={`text-white text-lg font-bold bg-white/20 px-4 py-2 rounded-full ${timeLeft <= 10 ? 'animate-pulse bg-red-500/40' : ''}`}>
              ⏱️ {timeLeft}s
            </div>
          )}
        </div>

        <div className="bg-slate-700 px-4 py-2 flex justify-between items-center border-b border-slate-600">
          <div className="text-yellow-400 font-bold">🏆 {totalPoints} Punkte</div>
          <div className="text-gray-400 text-sm">{messagesAnswered} Nachrichten</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
          {chatHistory.map((item, idx) => (
            <div key={idx} className={item.fadeOut ? 'animate-fade-out' : ''}>
              {item.type === 'incoming' ? (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="text-3xl">{item.message.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="text-white font-semibold text-sm">{item.message.from}</span>
                      <span className="text-gray-500 text-xs">{item.message.timestamp}</span>
                    </div>
                    <div className="bg-slate-700 rounded-2xl rounded-tl-none p-3 max-w-md">
                      <p className="text-white">{item.message.message}</p>
                    </div>
                  </div>
                </div>
              ) : item.type === 'penalty' ? (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="text-3xl">{item.message.avatar}</div>
                  <div className="flex-1">
                    <div className="bg-red-600/80 rounded-2xl rounded-tl-none p-3 max-w-md border-2 border-red-400">
                      <p className="text-white font-bold">{item.message.penaltyResponse}</p>
                    </div>
                    <span className="text-red-400 text-xs mt-1">⚠️ -{PENALTY_TIME} Sekunden Strafe!</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3 justify-end animate-slide-in">
                  <div className="flex-1 flex flex-col items-end">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl rounded-tr-none p-3 max-w-md">
                      <p className="text-white">{item.actualResponse}</p>
                    </div>
                    <span className="text-gray-500 text-xs mt-1">✓ Gesendet</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {showingIncoming && currentMessage && (
            <div className="flex items-start space-x-3 animate-pulse">
              <div className="text-3xl">{currentMessage.avatar}</div>
              <div className="bg-slate-700 rounded-2xl rounded-tl-none p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}

          {gameFinished && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⏰</div>
              <h3 className="text-2xl font-bold text-white mb-2">Zeit abgelaufen!</h3>
              <p className="text-gray-300">{messagesAnswered} Nachrichten beantwortet</p>
              <p className="text-yellow-400 text-xl font-bold">{totalPoints} Punkte</p>
              <p className="text-gray-400 text-sm mt-2">Warte auf die anderen Spieler...</p>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {!gameFinished && !showingIncoming && !showingPenalty && currentMessage && (
          <div className="bg-slate-800 border-t border-slate-700 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative bg-slate-700 rounded-2xl">
                {/* Ghost Text Overlay - positioned absolutely */}
                <div className="absolute inset-0 px-4 py-4 pointer-events-none flex items-center overflow-hidden">
                  <span className="text-lg font-mono whitespace-nowrap text-white opacity-30">
                    {currentMessage.requiredResponse.split('').map((char, idx) => (
                      <span
                        key={idx}
                        className={`transition-opacity duration-100 ${
                          idx < typedText.length ? 'opacity-0' : ''
                        }`}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                </div>
                {/* Actual Input - transparent background so ghost text shows through */}
                <input
                  ref={inputRef}
                  type="text"
                  value={typedText}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder=""
                  className="w-full bg-transparent text-white text-lg px-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono relative z-10"
                  autoFocus
                  style={{ caretColor: 'white' }}
                />
              </div>
              <button
                onClick={checkAnswer}
                disabled={!typedText.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all"
              >
                ➤
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2 text-center">
              💡 Tippe den Ghost-Text nach
            </p>
          </div>
        )}

        {(gameFinished || showingPenalty) && (
          <div className="bg-slate-800 border-t border-slate-700 p-4 text-center">
            <p className="text-gray-400">{gameFinished ? 'Spiel beendet...' : 'Penalty...'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
