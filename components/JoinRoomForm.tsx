'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinRoomForm() {
  const [roomSlug, setRoomSlug] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomSlug.trim()) return

    setIsLoading(true)

    // Navigate to the room page
    router.push(`/room/${roomSlug.toLowerCase()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="space-y-2">
        <label htmlFor="roomSlug" className="block text-sm font-medium text-gray-300">
          Raum-Code eingeben
        </label>
        <input
          id="roomSlug"
          type="text"
          value={roomSlug}
          onChange={(e) => setRoomSlug(e.target.value)}
          placeholder="z.B. silvester2025"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          disabled={isLoading}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={!roomSlug.trim() || isLoading}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? 'Beitrete...' : 'Raum beitreten'}
      </button>
    </form>
  )
}
