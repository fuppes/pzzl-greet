'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PUZZLE_TYPES, type PuzzleModule, type PuzzleType } from '@/types/puzzles'

interface PuzzleConfiguratorProps {
  roomId: string
  currentConfig?: PuzzleModule[]
  onSave: () => void
}

export default function PuzzleConfigurator({
  roomId,
  currentConfig = [],
  onSave
}: PuzzleConfiguratorProps) {
  const [puzzles, setPuzzles] = useState<PuzzleModule[]>(
    currentConfig.length > 0
      ? currentConfig
      : [
          { type: 'quiz', enabled: true, order: 0 },
          { type: 'memory', enabled: true, order: 1 },
          { type: 'word', enabled: true, order: 2 },
        ]
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const togglePuzzle = (type: PuzzleType) => {
    setPuzzles(puzzles.map(p =>
      p.type === type ? { ...p, enabled: !p.enabled } : p
    ))
  }

  const movePuzzle = (type: PuzzleType, direction: 'up' | 'down') => {
    const index = puzzles.findIndex(p => p.type === type)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= puzzles.length) return

    const newPuzzles = [...puzzles]
    ;[newPuzzles[index], newPuzzles[newIndex]] = [newPuzzles[newIndex], newPuzzles[index]]

    // Update order
    newPuzzles.forEach((p, i) => p.order = i)
    setPuzzles(newPuzzles)
  }

  const handleSave = async () => {
    setError('')
    setIsSaving(true)

    const enabledCount = puzzles.filter(p => p.enabled).length
    if (enabledCount === 0) {
      setError('Mindestens ein Puzzle muss aktiviert sein')
      setIsSaving(false)
      return
    }

    const supabase = createClient()
    // @ts-ignore
    const { error: updateError } = await supabase
      .from('rooms')
      .update({ puzzle_config: puzzles })
      .eq('id', roomId)

    if (updateError) {
      setError('Speichern fehlgeschlagen: ' + updateError.message)
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onSave()
  }

  const enabledPuzzles = puzzles.filter(p => p.enabled)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Puzzle-Module konfigurieren</h3>
          <p className="text-sm text-gray-400 mt-1">
            Wähle aus, welche Spiele in diesem Raum verfügbar sein sollen
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {isSaving ? 'Speichere...' : 'Konfiguration speichern'}
        </button>
      </div>

      {/* Puzzle List */}
      <div className="space-y-3">
        {puzzles.map((puzzle, index) => {
          const puzzleType = PUZZLE_TYPES[puzzle.type]

          return (
            <div
              key={puzzle.type}
              className={`p-4 rounded-xl border-2 transition-all ${
                puzzle.enabled
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-white/5 border-white/10 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Enable/Disable Toggle */}
                <button
                  type="button"
                  onClick={() => togglePuzzle(puzzle.type)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
                    puzzle.enabled
                      ? 'bg-green-500/20 hover:bg-green-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {puzzle.enabled ? '✓' : '○'}
                </button>

                {/* Puzzle Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{puzzleType.icon}</span>
                    <h4 className="text-lg font-semibold text-white">
                      {puzzleType.name}
                    </h4>
                    {puzzle.enabled && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded">
                        Aktiv
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {puzzleType.description}
                  </p>
                </div>

                {/* Order Controls */}
                {puzzle.enabled && (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => movePuzzle(puzzle.type, 'up')}
                      disabled={index === 0}
                      className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => movePuzzle(puzzle.type, 'down')}
                      disabled={index === puzzles.length - 1}
                      className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↓
                    </button>
                  </div>
                )}

                {/* Position Indicator */}
                {puzzle.enabled && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Reihenfolge</p>
                    <p className="text-xl font-bold text-white">
                      {enabledPuzzles.findIndex(p => p.type === puzzle.type) + 1}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong>{enabledPuzzles.length} Puzzle(s) aktiviert</strong>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Spieler müssen {enabledPuzzles.length} Rätsel lösen, um die Grüße zu sehen
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  )
}
