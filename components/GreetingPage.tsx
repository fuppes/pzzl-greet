'use client'

import { useState } from 'react'

interface GreetingPageProps {
  sessionId: string
  playerName: string
  videoUrl?: string | null
}

export default function GreetingPage({ sessionId, playerName, videoUrl }: GreetingPageProps) {
  const [videoError, setVideoError] = useState(false)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-6 py-8">
        <div className="text-6xl">🎆</div>
        <h1 className="text-5xl font-bold">
          <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            Frohes Neues Jahr!
          </span>
        </h1>
        <p className="text-2xl text-gray-300">
          Liebe Silvestergrüße für {playerName} und alle Mitspieler!
        </p>
      </div>

      {/* Video Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl overflow-hidden relative">
          {videoUrl && !videoError ? (
            <video
              controls
              className="w-full h-full object-contain bg-black"
              onError={() => setVideoError(true)}
            >
              <source src={videoUrl} type="video/mp4" />
              <source src={videoUrl} type="video/webm" />
              <source src={videoUrl} type="video/ogg" />
              Dein Browser unterstützt das Video-Tag nicht.
            </video>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              <div className="text-6xl">🎥</div>
              <div className="text-center space-y-2">
                <p className="text-xl font-semibold text-white">
                  {videoError ? 'Video konnte nicht geladen werden' : 'Noch kein Video hochgeladen'}
                </p>
                <p className="text-sm text-gray-400">
                  {videoError ? 'Bitte kontaktiere den Admin' : 'Das Video wird bald verfügbar sein!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Section */}
      <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-white mb-4 text-center">
          Unsere Wünsche für Euch
        </h2>
        <div className="space-y-4 text-lg text-gray-300">
          <p className="text-center">
            Vielen Dank, dass ihr alle mitgespielt habt!
          </p>
          <p className="text-center">
            Wir wünschen euch ein frohes neues Jahr voller Freude, Gesundheit und unvergesslicher Momente.
          </p>
          <p className="text-center text-2xl mt-6">
            🎊 Prosit Neujahr! 🥂
          </p>
        </div>
      </div>

      {/* Confetti Effect */}
      <div className="text-center space-y-4">
        <div className="flex justify-center gap-4 text-4xl animate-pulse">
          🎉 🎆 🎇 ✨ 🎊
        </div>
        <p className="text-gray-400 text-sm">
          Session-ID: <code className="bg-white/10 px-2 py-1 rounded">{sessionId}</code>
        </p>
      </div>
    </div>
  )
}
