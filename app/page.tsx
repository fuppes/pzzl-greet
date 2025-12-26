'use client'

import { useState } from 'react'
import JoinRoomForm from '@/components/JoinRoomForm'
import JoinSessionForm from '@/components/JoinSessionForm'
import Link from 'next/link'

export default function Home() {
  const [mode, setMode] = useState<'room' | 'session'>('session')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      {/* Admin Link */}
      <div className="absolute top-4 right-4">
        <Link
          href="/admin"
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all text-sm"
        >
          ⚙️ Admin
        </Link>
      </div>

      <div className="max-w-4xl w-full space-y-12 text-center">
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Greetings
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
            Löse Rätsel und Minigames, um deine persönlichen Grüße zu entdecken
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex justify-center gap-2 p-1 bg-white/5 rounded-lg border border-white/10 w-fit mx-auto">
          <button
            onClick={() => setMode('session')}
            className={`px-6 py-2 rounded-md transition-all ${
              mode === 'session'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Session beitreten
          </button>
          <button
            onClick={() => setMode('room')}
            className={`px-6 py-2 rounded-md transition-all ${
              mode === 'room'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Neues Spiel starten
          </button>
        </div>

        {/* Join Form */}
        <div className="flex justify-center">
          {mode === 'session' ? <JoinSessionForm /> : <JoinRoomForm />}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 pt-12">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-lg font-semibold mb-2 text-white">3 Rätsel</h3>
            <p className="text-gray-400 text-sm">
              Quiz, Puzzle und Wort-Rätsel für die ganze Familie
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold mb-2 text-white">Multiplayer</h3>
            <p className="text-gray-400 text-sm">
              Spielt zusammen mit Familie und Freunden
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
            <div className="text-4xl mb-4">🎁</div>
            <h3 className="text-lg font-semibold mb-2 text-white">Persönliche Grüße</h3>
            <p className="text-gray-400 text-sm">
              Entdecke Fotos und Videos am Ende
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
