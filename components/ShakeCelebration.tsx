'use client'

import { useState } from 'react'
import { useShake } from '@/hooks/useShake'

export default function ShakeCelebration() {
  const [showCelebration, setShowCelebration] = useState(false)

  useShake(() => {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)
  })

  if (!showCelebration) return null

  // Generate confetti
  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D', '#6BCF7F']
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.5 + Math.random() * 1,
    rotation: Math.random() * 360,
  }))

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Confetti explosion */}
      {confettiParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-4 h-4 animate-confetti"
          style={{
            left: `${particle.left}%`,
            top: '-10%',
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        />
      ))}

      {/* Shake message */}
      <div className="flex items-center justify-center h-screen">
        <div className="animate-success-bounce">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-8 rounded-3xl shadow-2xl shadow-purple-500/50">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-wiggle">🎊</div>
              <p className="text-3xl font-bold">Shake it!</p>
              <p className="text-sm opacity-90 mt-2">Konfetti für alle! 🎉</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
