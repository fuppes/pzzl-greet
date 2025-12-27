'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  session_id: string
  player_id: string
  room_id: string
  message: string
  emoji: string | null
  selfie_url: string | null
  created_at: string
  read: boolean
  player_name?: string
  room_name?: string
}

export default function Inbox() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('unread')

  useEffect(() => {
    loadMessages()
  }, [filter])

  const loadMessages = async () => {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    // Get rooms created by this user
    const { data: userRooms } = await supabase
      .from('rooms')
      .select('id')
      .eq('created_by', user.id)

    if (!userRooms || userRooms.length === 0) {
      setMessages([])
      setIsLoading(false)
      return
    }

    const roomIds = userRooms.map((room: any) => room.id)

    // Now get messages only for these rooms
    let query = supabase
      .from('player_messages')
      .select(`
        *,
        players!player_messages_player_id_fkey (name),
        rooms!player_messages_room_id_fkey (name)
      `)
      .in('room_id', roomIds)
      .order('created_at', { ascending: false})

    if (filter === 'unread') {
      query = query.eq('read', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading messages:', error)
      setIsLoading(false)
      return
    }

    // Map the data
    const mappedMessages: Message[] = (data || []).map((msg: any) => ({
      id: msg.id,
      session_id: msg.session_id,
      player_id: msg.player_id,
      room_id: msg.room_id,
      message: msg.message,
      emoji: msg.emoji,
      selfie_url: msg.selfie_url,
      created_at: msg.created_at,
      read: msg.read,
      player_name: msg.players?.name || 'Unbekannt',
      room_name: msg.rooms?.name || 'Unbekannt',
    }))

    setMessages(mappedMessages)
    setIsLoading(false)
  }

  const markAsRead = async (messageId: string) => {
    const supabase = createClient()

    await (supabase.from('player_messages') as any)
      .update({ read: true })
      .eq('id', messageId)

    loadMessages()
  }

  const markAllAsRead = async () => {
    const supabase = createClient()

    await (supabase.from('player_messages') as any)
      .update({ read: true })
      .eq('read', false)

    loadMessages()
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Nachricht wirklich löschen?')) return

    const supabase = createClient()

    await supabase
      .from('player_messages')
      .delete()
      .eq('id', messageId)

    loadMessages()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Gerade eben'
    if (diffMins < 60) return `vor ${diffMins} Min.`
    if (diffHours < 24) return `vor ${diffHours} Std.`
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`

    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const unreadCount = messages.filter((m) => !m.read).length

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Lade Nachrichten...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">📬 Inbox</h3>
          <p className="text-sm text-gray-400">
            {unreadCount > 0 ? `${unreadCount} ungelesene Nachricht${unreadCount > 1 ? 'en' : ''}` : 'Keine neuen Nachrichten'}
          </p>
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 text-sm bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded"
            >
              Alle als gelesen markieren
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'unread'
              ? 'bg-purple-500/30 text-purple-300 border-2 border-purple-500/50'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          Ungelesen ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'all'
              ? 'bg-purple-500/30 text-purple-300 border-2 border-purple-500/50'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          Alle ({messages.length})
        </button>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-400">
            {filter === 'unread' ? 'Keine ungelesenen Nachrichten' : 'Noch keine Nachrichten erhalten'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg border transition-all ${
                message.read
                  ? 'bg-white/5 border-white/10'
                  : 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Emoji */}
                {message.emoji && (
                  <div className="text-4xl flex-shrink-0">{message.emoji}</div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-white">
                        {message.player_name}
                        {!message.read && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500/30 text-purple-300 rounded">
                            Neu
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {message.room_name} • {formatDate(message.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      {!message.read && (
                        <button
                          onClick={() => markAsRead(message.id)}
                          className="px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded"
                          title="Als gelesen markieren"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded"
                        title="Löschen"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Selfie */}
                  {message.selfie_url && (
                    <div className="mb-3">
                      <img
                        src={message.selfie_url}
                        alt="Selfie"
                        className="w-48 h-48 object-cover rounded-lg border-2 border-white/20 shadow-lg"
                      />
                    </div>
                  )}

                  <p className="text-gray-200 whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
