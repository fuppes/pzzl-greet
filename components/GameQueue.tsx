'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Game, GameType, RoomGameQueueWithGame } from '@/types/games'
import { GAME_TYPES } from '@/types/games'

const DEFAULT_GAME_META = { icon: '🎮', name: 'Unbekannt' } as const

interface GameQueueProps {
  roomId: string
  onUpdate?: () => void
}

export default function GameQueue({ roomId, onUpdate }: GameQueueProps) {
  const [availableGames, setAvailableGames] = useState<Game[]>([])
  const [queuedGames, setQueuedGames] = useState<RoomGameQueueWithGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [roomId])

  const loadData = async () => {
    const supabase = createClient()

    // Load all available games
    const { data: games } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false })

    if (games) {
      setAvailableGames(games as Game[])
    }

    // Load queued games for this room
    const { data: queue } = await supabase
      .from('room_game_queue')
      .select(`
        *,
        games (*)
      `)
      .eq('room_id', roomId)
      .order('queue_position', { ascending: true })

    if (queue) {
      setQueuedGames(queue as RoomGameQueueWithGame[])
    }

    setIsLoading(false)
  }

  const addGameToQueue = async (gameId: string) => {
    const supabase = createClient()
    const nextPosition = queuedGames.length

    // @ts-ignore
    const { error } = await supabase.from('room_game_queue').insert({
      room_id: roomId,
      game_id: gameId,
      queue_position: nextPosition,
    })

    if (error) {
      if (error.code === '23505') {
        alert('Dieses Spiel ist bereits in der Queue')
      } else {
        alert('Fehler beim Hinzufügen: ' + error.message)
      }
      return
    }

    loadData()
    onUpdate?.()
  }

  const removeFromQueue = async (queueId: string) => {
    const supabase = createClient()

    const { error } = await supabase.from('room_game_queue').delete().eq('id', queueId)

    if (error) {
      alert('Fehler beim Entfernen: ' + error.message)
      return
    }

    // Reorder remaining items
    await reorderQueue()
  }

  const moveGame = async (queueId: string, direction: 'up' | 'down') => {
    const currentIndex = queuedGames.findIndex((q) => q.id === queueId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= queuedGames.length) return

    const supabase = createClient()

    // Swap positions
    const current = queuedGames[currentIndex]
    const other = queuedGames[newIndex]

    await (supabase
      .from('room_game_queue') as any)
      .update({ queue_position: newIndex })
      .eq('id', current.id)

    await (supabase
      .from('room_game_queue') as any)
      .update({ queue_position: currentIndex })
      .eq('id', other.id)

    loadData()
    onUpdate?.()
  }

  const reorderQueue = async () => {
    const supabase = createClient()

    // Get all queue items for this room
    const { data: queue } = await supabase
      .from('room_game_queue')
      .select('*')
      .eq('room_id', roomId)
      .order('queue_position', { ascending: true })

    if (!queue) return

    // Update positions sequentially
    for (let i = 0; i < queue.length; i++) {
      await (supabase
        .from('room_game_queue') as any)
        .update({ queue_position: i })
        .eq('id', (queue[i] as any).id)
    }

    loadData()
    onUpdate?.()
  }

  const handleDragStart = (e: React.DragEvent, queueId: string) => {
    setDraggedItemId(queueId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (!draggedItemId) return

    const dragIndex = queuedGames.findIndex(q => q.id === draggedItemId)
    if (dragIndex === -1 || dragIndex === dropIndex) {
      setDraggedItemId(null)
      setDragOverIndex(null)
      return
    }

    // Reorder array locally for instant feedback
    const newQueue = [...queuedGames]
    const [draggedItem] = newQueue.splice(dragIndex, 1)
    newQueue.splice(dropIndex, 0, draggedItem)

    setQueuedGames(newQueue)
    setDraggedItemId(null)
    setDragOverIndex(null)

    // Update database
    const supabase = createClient()
    for (let i = 0; i < newQueue.length; i++) {
      await (supabase
        .from('room_game_queue') as any)
        .update({ queue_position: i })
        .eq('id', newQueue[i].id)
    }

    onUpdate?.()
  }

  const handleDragEnd = () => {
    setDraggedItemId(null)
    setDragOverIndex(null)
  }

  if (isLoading) {
    return <div className="text-gray-400">Lade Spiele...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Spiel-Queue für diesen Raum</h4>

        {queuedGames.length === 0 ? (
          <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
            <p className="text-gray-400">Noch keine Spiele in der Queue.</p>
            <p className="text-sm text-gray-500 mt-1">Füge Spiele aus der Liste unten hinzu.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queuedGames.map((queueItem, index) => {
              const game = queueItem.games as unknown as Game
              const gameType = GAME_TYPES[game.game_type as GameType] || DEFAULT_GAME_META
              const isDragging = draggedItemId === queueItem.id
              const isDragOver = dragOverIndex === index

              return (
                <div
                  key={queueItem.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, queueItem.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-move transition-all ${
                    isDragging ? 'opacity-40 scale-95' : ''
                  } ${
                    isDragOver ? 'border-blue-500 bg-blue-500/10 scale-105' : ''
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded text-blue-300 font-semibold text-sm">
                    {index + 1}
                  </div>

                  <div className="text-xl cursor-grab active:cursor-grabbing">⋮⋮</div>

                  <div className="text-2xl">{gameType.icon}</div>

                  <div className="flex-1">
                    <div className="text-white font-medium">{game.name}</div>
                    <div className="text-xs text-gray-400">{gameType.name}</div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveGame(queueItem.id, 'up')}
                      disabled={index === 0}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                      title="Nach oben"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGame(queueItem.id, 'down')}
                      disabled={index === queuedGames.length - 1}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                      title="Nach unten"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromQueue(queueItem.id)}
                      className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded text-sm"
                      title="Entfernen"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-6">
        <h4 className="text-lg font-semibold text-white mb-3">Verfügbare Spiele</h4>

        {availableGames.length === 0 ? (
          <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
            <p className="text-gray-400">Noch keine Spiele erstellt.</p>
            <p className="text-sm text-gray-500 mt-1">
              Erstelle zuerst Spiele im &quot;Spiele verwalten&quot; Bereich.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableGames.map((game) => {
              const gameType = GAME_TYPES[game.game_type as GameType] || DEFAULT_GAME_META
              const isInQueue = queuedGames.some((q) => q.game_id === game.id)

              return (
                <div
                  key={game.id}
                  className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div className="text-2xl">{gameType.icon}</div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{game.name}</div>
                    <div className="text-xs text-gray-400">{gameType.name}</div>
                    {game.description && (
                      <div className="text-xs text-gray-500 truncate">{game.description}</div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => addGameToQueue(game.id)}
                    disabled={isInQueue}
                    className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isInQueue ? '✓ In Queue' : '+ Hinzufügen'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
