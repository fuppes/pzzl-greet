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
            <h3 className="text-lg font-semibold mb-2 text-white">Rätsel</h3>
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

        {/* GitHub Button */}
        <div className="pt-10 flex justify-center">
          <a
            href="https://github.com/fuppes/pzzl-greet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all group"
          >
            {/* GitHub Icon */}
            <svg
              className="w-6 h-6 fill-current group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.95.57.1.78-.25.78-.56v-2.02c-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.3 1.18-3.11-.12-.29-.51-1.45.11-3.03 0 0 .97-.31 3.18 1.19a11.1 11.1 0 0 1 2.9-.39c.99 0 1.99.13 2.9.39 2.2-1.5 3.17-1.19 3.17-1.19.63 1.58.24 2.74.12 3.03.73.81 1.17 1.85 1.17 3.11 0 4.43-2.69 5.4-5.25 5.68.41.35.78 1.05.78 2.12v3.15c0 .31.21.67.79.56A11.53 11.53 0 0 0 23.5 12C23.5 5.74 18.27.5 12 .5z" />
            </svg>

            <span className="text-sm font-medium">
              Projekt auf GitHub ansehen
            </span>
          </a>
        </div>
      </div>
    </main>
  )
}
