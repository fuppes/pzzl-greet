'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import VideoUpload from '@/components/VideoUpload'
import QuizEditor from '@/components/QuizEditor'

type Room = Database['public']['Tables']['rooms']['Row']

interface AdminDashboardProps {
  rooms: Room[]
  user: User
}

export default function AdminDashboard({ rooms: initialRooms, user }: AdminDashboardProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin')
    router.refresh()
  }

  const refreshRooms = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setRooms(data)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Möchtest du diesen Raum wirklich löschen? Alle Sessions und Daten werden gelöscht.')) {
      return
    }

    const supabase = createClient()
    // @ts-ignore
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)

    if (error) {
      alert('Fehler beim Löschen: ' + error.message)
    } else {
      refreshRooms()
    }
  }

  const handleToggleActive = async (room: Room) => {
    const supabase = createClient()
    // @ts-ignore
    const { error } = await supabase
      .from('rooms')
      .update({ is_active: !room.is_active })
      .eq('id', room.id)

    if (error) {
      alert('Fehler beim Aktualisieren: ' + error.message)
    } else {
      refreshRooms()
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

    const supabase = createClient()

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

    console.log('Submitting room data:', roomData)

    if (room) {
      // Update existing room
      // @ts-ignore
      const { data, error } = await supabase
        .from('rooms')
        .update(roomData)
        .eq('id', room.id)
        .select()

      console.log('Update result:', { data, error })

      if (error) {
        alert('Fehler beim Aktualisieren: ' + error.message)
        setIsLoading(false)
        return
      }
    } else {
      // Create new room
      // @ts-ignore
      const { data, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()

      console.log('Insert result:', { data, error })

      if (error) {
        alert('Fehler beim Erstellen: ' + error.message)
        setIsLoading(false)
        return
      }
    }

    setIsLoading(false)
    onSuccess()
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

        {/* Video Upload & Quiz Editor - only show when editing existing room */}
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
              <QuizEditor
                roomId={room.id}
                currentQuizData={(room as any).quiz_data}
                onSave={() => {
                  // Refresh will happen on form close
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
