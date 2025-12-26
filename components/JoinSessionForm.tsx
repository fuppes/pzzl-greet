'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinSessionForm() {
  const [sessionCode, setSessionCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionCode.trim()) return

    setIsLoading(true)

    // Navigate to the join page
    router.push(`/join/${sessionCode.toUpperCase()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="space-y-2">
        <label htmlFor="sessionCode" className="block text-sm font-medium text-gray-300">
          Session-Code eingeben
        </label>
        <input
          id="sessionCode"
          type="text"
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
          placeholder="z.B. ABC123"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center text-xl font-mono tracking-wider"
          disabled={isLoading}
          autoComplete="off"
          maxLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={!sessionCode.trim() || isLoading}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? 'Beitrete...' : 'Session beitreten'}
      </button>
    </form>
  )
}
