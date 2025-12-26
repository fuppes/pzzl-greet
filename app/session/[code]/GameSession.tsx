'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import QuizWithLeaderboard from '@/components/puzzles/QuizWithLeaderboard'
import MemoryWithLeaderboard from '@/components/puzzles/MemoryWithLeaderboard'
import WordWithLeaderboard from '@/components/puzzles/WordWithLeaderboard'
import FinalLeaderboard from '@/components/FinalLeaderboard'
import GreetingPage from '@/components/GreetingPage'
import type { Database } from '@/types/database'
import type { RoomGameQueueWithGame } from '@/types/games'

type GameSession = Database['public']['Tables']['game_sessions']['Row'] & {
  rooms: Database['public']['Tables']['rooms']['Row'] | null
  game_queue?: RoomGameQueueWithGame[]
}

type Player = Database['public']['Tables']['players']['Row']

interface GameSessionProps {
  session: GameSession
}

export default function GameSession({ session: initialSession }: GameSessionProps) {
  const [session, setSession] = useState<GameSession>(initialSession)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showGreeting, setShowGreeting] = useState(false)

  // Get games from queue
  const gameQueue = (session as any).game_queue || []
  const totalGames = gameQueue.length

  useEffect(() => {
    const supabase = createClient()

    // Get current player from localStorage
    const playerId = localStorage.getItem('player_id')

    // Load players
    const loadPlayers = async () => {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', session.id)
        .order('joined_at', { ascending: true })

      if (data) {
        setPlayers(data)
        const player = data.find((p: Player) => p.id === playerId)
        if (player) setCurrentPlayer(player)
      }
      setIsLoading(false)
    }

    loadPlayers()

    // Subscribe to player changes
    const playersChannel = supabase
      .channel(`session_${session.id}_players`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          loadPlayers()
        }
      )
      .subscribe()

    // Subscribe to session changes
    const sessionChannel = supabase
      .channel(`session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          setSession(prev => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(playersChannel)
      supabase.removeChannel(sessionChannel)
    }
  }, [session.id])

  const handleStartGame = async () => {
    console.log('Starting game...', session.id)

    // Update local state immediately for instant feedback
    const startedAt = new Date().toISOString()
    setSession(prev => ({
      ...prev,
      status: 'in_progress' as const,
      started_at: startedAt,
    } as GameSession))

    const supabase = createClient()
    const { data, error } = await (supabase
      .from('game_sessions') as any)
      .update({
        status: 'in_progress',
        started_at: startedAt,
      })
      .eq('id', session.id)
      .select()

    console.log('Update result:', { data, error })
    if (error) {
      console.error('Error starting game:', error)
      // Revert on error
      setSession(prev => ({
        ...prev,
        status: 'waiting' as const,
        started_at: null,
      } as GameSession))
    }
  }

  const handlePuzzleComplete = async () => {
    const supabase = createClient()
    const nextPuzzleIndex = session.current_puzzle_index + 1

    if (nextPuzzleIndex >= totalGames) {
      // All games completed - update local state immediately
      const completedAt = new Date().toISOString()
      setSession(prev => ({
        ...prev,
        status: 'completed' as const,
        completed_at: completedAt,
      } as GameSession))

      await (supabase
        .from('game_sessions') as any)
        .update({
          status: 'completed',
          completed_at: completedAt,
        })
        .eq('id', session.id)
    } else {
      // Move to next game - update local state immediately
      setSession(prev => ({
        ...prev,
        current_puzzle_index: nextPuzzleIndex,
      } as GameSession))

      await (supabase
        .from('game_sessions') as any)
        .update({
          current_puzzle_index: nextPuzzleIndex,
        })
        .eq('id', session.id)
    }
  }

  const handleShowGreeting = () => {
    setShowGreeting(true)
  }

  const isHost = currentPlayer?.id === session.host_player_id

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
        <div className="text-gray-400">Lade...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {session.rooms?.name}
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-400">Session Code:</span>
            <code className="px-4 py-2 bg-white/10 rounded-lg text-xl font-mono text-white border border-white/20">
              {session.session_code}
            </code>
          </div>
        </div>

        {/* Lobby */}
        {session.status === 'waiting' && (
          <div className="space-y-6">
            {/* Players List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                Spieler ({players.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: player.color || '#3b82f6' }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{player.name}</p>
                      {player.id === session.host_player_id && (
                        <p className="text-xs text-gray-400">Host</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code & Instructions */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Code */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Mit dem Handy beitreten
                </h3>
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    size={180}
                    level="H"
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  QR-Code scannen zum Beitreten
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-300 mb-2">
                  Wie es funktioniert
                </h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Teile den Session-Code mit deinen Freunden</li>
                  <li>• Oder scanne den QR-Code mit dem Handy</li>
                  <li>• Löst gemeinsam {totalGames} Spiele</li>
                  <li>• Am Ende erwarten euch persönliche Grüße</li>
                </ul>
              </div>
            </div>

            {/* Start Button (Host only) */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/50"
              >
                Spiel starten
              </button>
            ) : (
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400">
                  Warte darauf, dass der Host das Spiel startet...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Game in Progress */}
        {session.status === 'in_progress' && currentPlayer && (
          <div>
            {/* Render current game based on queue */}
            {session.current_puzzle_index < gameQueue.length && (() => {
              const queueItem = gameQueue[session.current_puzzle_index]
              const game = queueItem.games as any

              if (game.game_type === 'quiz') {
                return (
                  <QuizWithLeaderboard
                    sessionId={session.id}
                    playerId={currentPlayer.id}
                    players={players}
                    quizData={game.config}
                    isHost={isHost}
                    onContinue={handlePuzzleComplete}
                    puzzleIndex={session.current_puzzle_index}
                    totalGames={totalGames}
                    roomId={(session.rooms as any)?.id}
                  />
                )
              }

              if (game.game_type === 'memory') {
                return (
                  <MemoryWithLeaderboard
                    sessionId={session.id}
                    playerId={currentPlayer.id}
                    players={players}
                    memoryData={game.config}
                    isHost={isHost}
                    onContinue={handlePuzzleComplete}
                    puzzleIndex={session.current_puzzle_index}
                    totalGames={totalGames}
                    roomId={(session.rooms as any)?.id}
                  />
                )
              }

              if (game.game_type === 'word') {
                return (
                  <WordWithLeaderboard
                    sessionId={session.id}
                    playerId={currentPlayer.id}
                    players={players}
                    wordData={game.config}
                    isHost={isHost}
                    onContinue={handlePuzzleComplete}
                    puzzleIndex={session.current_puzzle_index}
                    totalGames={totalGames}
                    roomId={(session.rooms as any)?.id}
                  />
                )
              }

              return null
            })()}
          </div>
        )}

        {/* Game Completed - Final Leaderboard */}
        {session.status === 'completed' && currentPlayer && !showGreeting && (
          <FinalLeaderboard
            sessionId={session.id}
            players={players}
            currentPlayerId={currentPlayer.id}
            isHost={isHost}
            onContinue={handleShowGreeting}
          />
        )}

        {/* Greeting Page */}
        {session.status === 'completed' && currentPlayer && showGreeting && (
          <GreetingPage
            sessionId={session.id}
            playerId={currentPlayer.id}
            playerName={currentPlayer.name}
            videoUrl={(session.rooms as any)?.video_url || null}
            roomId={(session.rooms as any)?.id}
          />
        )}
      </div>
    </main>
  )
}
