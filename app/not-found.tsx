'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const gameStateRef = useRef({
    kangaroo: { x: 50, y: 0, velocityY: 0, isJumping: false },
    obstacles: [] as { x: number; y: number; width: number; height: number; emoji: string }[],
    ground: 0,
    score: 0,
    gameSpeed: 5,
    animationId: 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Canvas Größe setzen
    canvas.width = 800
    canvas.height = 300
    const ground = canvas.height - 80

    gameStateRef.current.ground = ground
    gameStateRef.current.kangaroo.y = ground

    // High Score aus localStorage laden
    const savedHighScore = localStorage.getItem('kangaroo-high-score')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore))
    }

    // Jump Handler
    const handleJump = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        jump()
      }
      if ((e.code === 'KeyR' || e.key === 'r') && gameOver) {
        restartGame()
      }
    }

    const handleTouch = () => {
      if (gameOver) {
        restartGame()
      } else {
        jump()
      }
    }

    window.addEventListener('keydown', handleJump)
    canvas.addEventListener('click', handleTouch)

    // Game Loop starten
    gameLoop()

    return () => {
      window.removeEventListener('keydown', handleJump)
      canvas.removeEventListener('click', handleTouch)
      cancelAnimationFrame(gameStateRef.current.animationId)
    }
  }, [gameOver])

  const jump = () => {
    const state = gameStateRef.current
    if (!state.kangaroo.isJumping) {
      state.kangaroo.isJumping = true
      state.kangaroo.velocityY = -15
    }
  }

  const restartGame = () => {
    const state = gameStateRef.current
    state.kangaroo.y = state.ground
    state.kangaroo.velocityY = 0
    state.kangaroo.isJumping = false
    state.obstacles = []
    state.score = 0
    state.gameSpeed = 5
    setScore(0)
    setGameOver(false)
  }

  const gameLoop = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const state = gameStateRef.current

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Hintergrund
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Boden
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, state.ground + 30)
    ctx.lineTo(canvas.width, state.ground + 30)
    ctx.stroke()

    // Känguru Physik
    if (state.kangaroo.isJumping) {
      state.kangaroo.velocityY += 0.8 // Gravitation
      state.kangaroo.y += state.kangaroo.velocityY

      if (state.kangaroo.y >= state.ground) {
        state.kangaroo.y = state.ground
        state.kangaroo.velocityY = 0
        state.kangaroo.isJumping = false
      }
    }

    // Känguru zeichnen
    // Känguru zeichnen (nach rechts gespiegelt)
    ctx.save()
    ctx.font = '48px Arial'
      
    // Spiegelung auf der X-Achse
    ctx.scale(-1, 1)
      
    // X-Position muss negativ sein wegen scale(-1, 1)
    ctx.fillText(
      '🦘',
      -(state.kangaroo.x + 48), // 48 ≈ Emoji-Breite
      state.kangaroo.y + 20
    )
    
    ctx.restore()


    // Hindernisse spawnen
    if (state.obstacles.length === 0 || state.obstacles[state.obstacles.length - 1].x < canvas.width - 300) {
      const obstacles = ['🌵', '🔥', '🪨', '⚡']
      const randomObstacle = obstacles[Math.floor(Math.random() * obstacles.length)]
      state.obstacles.push({
        x: canvas.width,
        y: state.ground,
        width: 40,
        height: 48,
        emoji: randomObstacle,
      })
    }

    // Hindernisse bewegen und zeichnen
    ctx.font = '40px Arial'
    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const obs = state.obstacles[i]
      obs.x -= state.gameSpeed

      ctx.fillText(obs.emoji, obs.x, obs.y + 20)

      // Kollisionserkennung (vereinfacht)
      const kangarooBox = {
        x: state.kangaroo.x + 10,
        y: state.kangaroo.y,
        width: 35,
        height: 45,
      }
      const obsBox = {
        x: obs.x + 5,
        y: obs.y - 5,
        width: obs.width - 10,
        height: obs.height - 10,
      }

      if (
        kangarooBox.x < obsBox.x + obsBox.width &&
        kangarooBox.x + kangarooBox.width > obsBox.x &&
        kangarooBox.y < obsBox.y + obsBox.height &&
        kangarooBox.y + kangarooBox.height > obsBox.y
      ) {
        // Game Over!
        setGameOver(true)
        if (state.score > highScore) {
          setHighScore(state.score)
          localStorage.setItem('kangaroo-high-score', state.score.toString())
        }
        return
      }

      // Hindernis entfernen wenn außerhalb
      if (obs.x + obs.width < 0) {
        state.obstacles.splice(i, 1)
        state.score += 10
        setScore(state.score)

        // Geschwindigkeit erhöhen
        if (state.score % 100 === 0) {
          state.gameSpeed += 0.5
        }
      }
    }

    // Weiter loopen
    if (!gameOver) {
      state.animationId = requestAnimationFrame(gameLoop)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-8xl font-bold text-white">404</h1>
          <p className="text-2xl text-gray-300">Hoppla! Diese Seite wurde nicht gefunden.</p>
          <p className="text-gray-400">
            Aber hey, spiel eine Runde während du hier bist! 🦘
          </p>
        </div>

        {/* Score Display */}
        <div className="flex justify-between items-center text-white text-xl px-4">
          <div>
            Score: <span className="font-bold text-yellow-400">{score}</span>
          </div>
          <div>
            High Score: <span className="font-bold text-purple-400">{highScore}</span>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full border-4 border-slate-600 rounded-lg shadow-2xl bg-slate-900"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
              <div className="text-center space-y-4">
                <p className="text-4xl font-bold text-red-400">Game Over!</p>
                <p className="text-2xl text-white">Score: {score}</p>
                {score > highScore && (
                  <p className="text-xl text-yellow-400 animate-pulse">🎉 Neuer High Score! 🎉</p>
                )}
                <button
                  onClick={restartGame}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                >
                  Nochmal spielen [R]
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="text-center space-y-3">
          <p className="text-gray-300">
            <kbd className="px-3 py-1 bg-slate-700 rounded border border-slate-500 text-white font-mono">
              Space
            </kbd>{' '}
            oder{' '}
            <kbd className="px-3 py-1 bg-slate-700 rounded border border-slate-500 text-white font-mono">
              Click
            </kbd>{' '}
            zum Springen
          </p>
          <p className="text-gray-400 text-sm">
            Weiche den Hindernissen aus! Je länger du durchhältst, desto schneller wird's.
          </p>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/50"
          >
            ← Zurück zur Startseite
          </Link>
        </div>

        {/* Easter Egg Hint */}
        <p className="text-center text-gray-500 text-sm">
          💡 Tipp: Schaff 500 Punkte für eine Überraschung... (coming soon)
        </p>
      </div>
    </div>
  )
}
