'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import VideoUpload from '@/components/VideoUpload'
import GameEditor from '@/components/GameEditor'
import GameQueue from '@/components/GameQueue'
import Inbox from '@/components/Inbox'
import type { Game } from '@/types/games'
import { getUserFriendlyMessage, logError } from '@/lib/error-handler'

type Room = Database['public']['Tables']['rooms']['Row']

interface AdminDashboardProps {
  rooms: Room[]
  user: User
}

export default function AdminDashboard({ rooms: initialRooms, user }: AdminDashboardProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [activeTab, setActiveTab] = useState<'rooms' | 'games' | 'inbox'>('rooms')
  const [games, setGames] = useState<Game[]>([])
  const [showGameEditor, setShowGameEditor] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (activeTab === 'games') {
      refreshGames()
    }
  }, [activeTab])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin')
    router.refresh()
  }

  const refreshRooms = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setRooms(data)
    } catch (error) {
      logError(error as Error, 'refreshRooms')
      alert(getUserFriendlyMessage(error as Error))
    }
  }

  const refreshGames = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setGames(data as Game[])
    } catch (error) {
      logError(error as Error, 'refreshGames')
      alert(getUserFriendlyMessage(error as Error))
    }
  }

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Möchtest du dieses Spiel wirklich löschen?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from('games').delete().eq('id', gameId)

      if (error) throw error
      await refreshGames()
    } catch (error) {
      logError(error as Error, 'handleDeleteGame')
      alert(getUserFriendlyMessage(error as Error))
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Möchtest du diesen Raum wirklich löschen? Alle Sessions und Daten werden gelöscht.')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)

      if (error) throw error
      await refreshRooms()
    } catch (error) {
      logError(error as Error, 'handleDeleteRoom')
      alert(getUserFriendlyMessage(error as Error))
    }
  }

  const handleToggleActive = async (room: Room) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('rooms')
        // @ts-expect-error - Supabase type inference issue
        .update({ is_active: !room.is_active })
        .eq('id', room.id)

      if (error) throw error
      await refreshRooms()
    } catch (error) {
      logError(error as Error, 'handleToggleActive')
      alert(getUserFriendlyMessage(error as Error))
    }
  }

  const handleShareRoom = async (room: Room) => {
    const url = `${window.location.origin}/room/${room.slug}`
    try {
      await navigator.clipboard.writeText(url)
      alert(`Link wurde kopiert: ${url}`)
    } catch (error) {
      // Fallback if clipboard API is not available
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        alert(`Link wurde kopiert: ${url}`)
      } catch (err) {
        alert(`Link: ${url}`)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                Admin Panel
              </span>
            </h1>
            <p className="text-gray-400 mt-2">
              Angemeldet als: <span className="text-white">{user.email}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all"
            >
              ← Startseite
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all"
            >
              Abmelden
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'rooms'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Räume verwalten
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'games'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Spiele verwalten
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'inbox'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            📬 Inbox
          </button>
        </div>

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <>
            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowCreateForm(true)
                  setEditingRoom(null)
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all"
              >
                + Neuen Raum erstellen
              </button>
              <button
                onClick={refreshRooms}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all"
              >
                🔄 Aktualisieren
              </button>
            </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingRoom) && (
          <RoomForm
            room={editingRoom}
            onClose={() => {
              setShowCreateForm(false)
              setEditingRoom(null)
            }}
            onSuccess={() => {
              setShowCreateForm(false)
              setEditingRoom(null)
              refreshRooms()
            }}
          />
        )}

        {/* Rooms List */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Räume ({rooms.length})
          </h2>

          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Noch keine Räume erstellt.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 text-blue-400 hover:text-blue-300 transition-all"
              >
                Erstelle deinen ersten Raum →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          {room.name}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            room.is_active
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}
                        >
                          {room.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        Slug: <code className="bg-white/10 px-2 py-1 rounded">{room.slug}</code>
                      </p>
                      {room.description && (
                        <p className="text-gray-300 mb-2">{room.description}</p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>Erstellt: {new Date(room.created_at).toLocaleDateString('de-DE')}</span>
                        {room.expires_at && (
                          <span className={`${new Date(room.expires_at) < new Date() ? 'text-red-400' : ''}`}>
                            Läuft ab: {new Date(room.expires_at).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <Link
                          href={`/room/${room.slug}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                          target="_blank"
                        >
                          → Raum öffnen
                        </Link>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShareRoom(room)}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-lg transition-all text-sm"
                        title="Link kopieren"
                      >
                        📤 Teilen
                      </button>
                      <button
                        onClick={() => setEditingRoom(room)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg transition-all text-sm"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleToggleActive(room)}
                        className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 rounded-lg transition-all text-sm"
                      >
                        {room.is_active ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all text-sm"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}

        {/* Games Tab */}
        {activeTab === 'games' && (
          <>
            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowGameEditor(true)
                  setEditingGame(null)
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all"
              >
                + Neues Spiel erstellen
              </button>
              <button
                onClick={refreshGames}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all"
              >
                🔄 Aktualisieren
              </button>
            </div>

            {/* Game Editor */}
            {(showGameEditor || editingGame) && (
              <GameEditor
                game={editingGame || undefined}
                onSave={() => {
                  setShowGameEditor(false)
                  setEditingGame(null)
                  refreshGames()
                }}
                onCancel={() => {
                  setShowGameEditor(false)
                  setEditingGame(null)
                }}
              />
            )}

            {/* Games List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold text-white mb-6">Spiele ({games.length})</h2>

              {games.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Noch keine Spiele erstellt.</p>
                  <button
                    onClick={() => setShowGameEditor(true)}
                    className="mt-4 text-blue-400 hover:text-blue-300 transition-all"
                  >
                    Erstelle dein erstes Spiel →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {games.map((game) => {
                    const gameType = game.game_type
                    const icon =
                      gameType === 'quiz' ? '❓' : gameType === 'memory' ? '🎴' : '🔤'
                    const typeName =
                      gameType === 'quiz' ? 'Quiz' : gameType === 'memory' ? 'Memory' : 'Wörter-Rätsel'

                    return (
                      <div
                        key={game.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">{icon}</div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-1">{game.name}</h3>
                            <p className="text-sm text-gray-400 mb-2">{typeName}</p>
                            {game.description && (
                              <p className="text-gray-300 text-sm mb-3">{game.description}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Erstellt: {new Date(game.created_at).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => setEditingGame(game)}
                            className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg transition-all text-sm"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDeleteGame(game.id)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all text-sm"
                          >
                            Löschen
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <Inbox />
          </div>
        )}
      </div>
    </main>
  )
}

interface RoomFormProps {
  room: Room | null
  onClose: () => void
  onSuccess: () => void
}

function RoomForm({ room, onClose, onSuccess }: RoomFormProps) {
  const [name, setName] = useState(room?.name || '')
  const [slug, setSlug] = useState(room?.slug || '')
  const [description, setDescription] = useState(room?.description || '')
  const [expiresAt, setExpiresAt] = useState(
    room?.expires_at ? new Date(room.expires_at).toISOString().split('T')[0] : ''
  )
  const [isLoading, setIsLoading] = useState(false)

  // Update form when room changes
  useEffect(() => {
    if (room) {
      setName(room.name)
      setSlug(room.slug)
      setDescription(room.description || '')
      setExpiresAt(room.expires_at ? new Date(room.expires_at).toISOString().split('T')[0] : '')
    } else {
      setName('')
      setSlug('')
      setDescription('')
      setExpiresAt('')
    }
  }, [room])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!room) {
      setSlug(generateSlug(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) {
        alert('Nicht angemeldet')
        setIsLoading(false)
        return
      }

      // Parse date correctly - add time to ensure it's treated as end of day
      let expiresAtISO = null
      if (expiresAt) {
        const dateObj = new Date(expiresAt + 'T23:59:59.999Z')
        expiresAtISO = dateObj.toISOString()
      }

      const roomData = {
        name,
        slug,
        description: description || null,
        expires_at: expiresAtISO,
        updated_at: new Date().toISOString(),
      }

      if (room) {
        // Update existing room
        const { error } = await supabase
          .from('rooms')
          // @ts-expect-error - Supabase type inference issue
          .update(roomData)
          .eq('id', room.id)
          .select()

        if (error) throw error
      } else {
        // Create new room - add created_by
        const newRoomData = {
          ...roomData,
          created_by: user.id,
        }

        const { error } = await supabase
          .from('rooms')
          // @ts-expect-error - Supabase type inference issue
          .insert(newRoomData)
          .select()

        if (error) throw error
      }

      setIsLoading(false)
      onSuccess()
    } catch (error) {
      logError(error as Error, 'handleSubmit (RoomForm)')
      alert(getUserFriendlyMessage(error as Error))
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-2xl font-semibold text-white mb-6">
        {room ? 'Raum bearbeiten' : 'Neuen Raum erstellen'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Silvester 2025/2026"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Slug (URL) *
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            pattern="[a-z0-9\-]+"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="z.B. silvester-2025-2026"
          />
          <p className="text-xs text-gray-400 mt-1">
            Nur Kleinbuchstaben, Zahlen und Bindestriche
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optionale Beschreibung des Raums"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ablaufdatum
          </label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Leer lassen für unbegrenzte Gültigkeit
          </p>
        </div>

        {/* Video Upload & Game Queue - only show when editing existing room */}
        {room && (
          <>
            <div className="pt-4 border-t border-white/10">
              <VideoUpload
                roomId={room.id}
                roomSlug={room.slug}
                currentVideoUrl={(room as any).video_url}
                onUploadComplete={() => {
                  // Refresh will happen on form close
                }}
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4">Spiel-Queue</h4>
              <p className="text-sm text-gray-400 mb-4">
                Wähle Spiele aus und ordne sie in der gewünschten Reihenfolge an.
                Erstelle neue Spiele im Tab &quot;Spiele verwalten&quot;.
              </p>
              <GameQueue
                roomId={room.id}
                onUpdate={() => {
                  // Optionally refresh room data
                }}
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            {isLoading ? 'Speichere...' : room ? 'Aktualisieren' : 'Erstellen'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}
