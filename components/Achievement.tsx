'use client'

import { useEffect, useState } from 'react'

export interface AchievementData {
  id: string
  emoji: string
  title: string
  description: string
}

interface AchievementProps {
  achievement: AchievementData
  onComplete?: () => void
}

export default function Achievement({ achievement, onComplete }: AchievementProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onComplete])

  if (!visible) return null

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none animate-success-bounce">
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white px-8 py-6 rounded-2xl shadow-2xl shadow-orange-500/50 max-w-md">
        <div className="flex items-center gap-4">
          {/* Achievement Icon */}
          <div className="text-6xl animate-spin-slow">{achievement.emoji}</div>

          {/* Achievement Text */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wide opacity-90">Achievement freigeschaltet!</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">{achievement.title}</h3>
            <p className="text-sm opacity-90">{achievement.description}</p>
          </div>
        </div>

        {/* Progress bar animation */}
        <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white animate-[shrink_4s_linear]"></div>
        </div>
      </div>
    </div>
  )
}

// Helper function to check achievements
export function checkAchievements(playerActions: any[], players: any[], currentPlayerId: string): AchievementData[] {
  const achievements: AchievementData[] = []

  // Count player's actions
  const myActions = playerActions.filter(a => a.player_id === currentPlayerId)
  const correctAnswers = myActions.filter(a => a.data?.isCorrect === true).length
  const totalAnswers = myActions.length

  // Achievement: Perfect Score (alle richtig)
  if (totalAnswers > 0 && correctAnswers === totalAnswers) {
    achievements.push({
      id: 'perfect_score',
      emoji: '🏆',
      title: 'Perfekt!',
      description: 'Alle Spiele ohne Fehler gemeistert!'
    })
  }

  // Achievement: Speed Demon (schnellster Spieler)
  const playerScores: Record<string, number> = {}
  playerActions.forEach(action => {
    const points = action.data?.points || 0
    playerScores[action.player_id] = (playerScores[action.player_id] || 0) + points
  })

  const myScore = playerScores[currentPlayerId] || 0
  const isHighestScore = Object.values(playerScores).every(score => myScore >= score) && myScore > 0

  if (isHighestScore && players.length > 1) {
    achievements.push({
      id: 'top_scorer',
      emoji: '⚡',
      title: 'Champion!',
      description: 'Höchste Punktzahl erreicht!'
    })
  }

  // Achievement: First Blood (als erster fertig)
  if (myActions.length > 0) {
    const myLastAction = myActions[myActions.length - 1]
    const allLastActions = playerActions.reduce((acc: any, action) => {
      if (!acc[action.player_id] || new Date(action.created_at) > new Date(acc[action.player_id].created_at)) {
        acc[action.player_id] = action
      }
      return acc
    }, {})

    const isFirst = Object.values(allLastActions).every((action: any) =>
      new Date(myLastAction.created_at) <= new Date(action.created_at)
    )

    if (isFirst && players.length > 1) {
      achievements.push({
        id: 'speed_demon',
        emoji: '🚀',
        title: 'Blitzschnell!',
        description: 'Als Erster fertig!'
      })
    }
  }

  return achievements
}
