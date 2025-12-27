'use client'

import { useEffect, useState } from 'react'

interface SuccessAnimationProps {
  show: boolean
  message?: string
  emoji?: string
  onComplete?: () => void
}

export default function SuccessAnimation({
  show,
  message = 'Richtig!',
  emoji = '🎉',
  onComplete
}: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!visible) return null

  // Generate random confetti particles
  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D', '#6BCF7F']
  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1,
    rotation: Math.random() * 360,
  }))

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Confetti */}
      {confettiParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-confetti"
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

      {/* Success Message */}
      <div className="animate-success-bounce">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-6 rounded-2xl shadow-2xl shadow-green-500/50 transform scale-100">
          <div className="flex items-center gap-4">
            <div className="text-6xl animate-spin-slow">{emoji}</div>
            <div>
              <p className="text-3xl font-bold">{message}</p>
              <p className="text-sm opacity-90 mt-1">Weiter so!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ripple Effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-green-400/30 animate-ping" />
      </div>
    </div>
  )
}
