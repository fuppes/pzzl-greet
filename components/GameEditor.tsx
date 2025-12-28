'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Game, GameType, QuizConfig, MemoryConfig, WordConfig, ChatTypingConfig, QuizQuestion, MemoryPair, WordPuzzle } from '@/types/games'
import { GAME_TYPES } from '@/types/games'
import { getUserFriendlyMessage, logError } from '@/lib/error-handler'

interface GameEditorProps {
  game?: Game
  onSave: () => void
  onCancel: () => void
}

export default function GameEditor({ game, onSave, onCancel }: GameEditorProps) {
  const [name, setName] = useState(game?.name || '')
  const [description, setDescription] = useState(game?.description || '')
  const [gameType, setGameType] = useState<GameType>(game?.game_type || 'quiz')
  const [config, setConfig] = useState<any>(game?.config || GAME_TYPES.quiz.defaultConfig)
  const [isSaving, setIsSaving] = useState(false)

  // Update config when game type changes
  const handleGameTypeChange = (type: GameType) => {
    setGameType(type)
    if (!game) {
      // Only reset config when creating new game
      setConfig(GAME_TYPES[type].defaultConfig)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Bitte gib einen Namen ein')
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()

      const gameData = {
        name,
        description: description || null,
        game_type: gameType,
        config,
        updated_at: new Date().toISOString(),
      }

      if (game) {
        const { error } = await supabase
          .from('games')
          .update(gameData)
          .eq('id', game.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('games').insert(gameData)

        if (error) throw error
      }

      setIsSaving(false)
      onSave()
    } catch (error) {
      logError(error as Error, 'handleSave (GameEditor)')
      alert(getUserFriendlyMessage(error as Error))
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-2xl font-semibold text-white mb-6">
        {game ? 'Spiel bearbeiten' : 'Neues Spiel erstellen'}
      </h3>

      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Silvester Quiz 2025"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optionale Beschreibung"
          />
        </div>

        {/* Game Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Spieltyp *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {Object.values(GAME_TYPES).map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleGameTypeChange(type.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  gameType === type.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <div className="text-white font-medium">{type.name}</div>
                <div className="text-xs text-gray-400 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Game Type Specific Config */}
        <div className="pt-4 border-t border-white/10">
          {gameType === 'quiz' && (
            <QuizConfigEditor config={config as QuizConfig} onChange={setConfig} />
          )}
          {gameType === 'memory' && (
            <MemoryConfigEditor config={config as MemoryConfig} onChange={setConfig} />
          )}
          {gameType === 'word' && (
            <WordConfigEditor config={config as WordConfig} onChange={setConfig} />
          )}
          {gameType === 'chat_typing' && (
            <ChatTypingConfigEditor config={config as ChatTypingConfig} onChange={setConfig} />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            {isSaving ? 'Speichere...' : game ? 'Aktualisieren' : 'Erstellen'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}

// Quiz Config Editor
function QuizConfigEditor({
  config,
  onChange,
}: {
  config: QuizConfig
  onChange: (config: QuizConfig) => void
}) {
  const addQuestion = () => {
    onChange({
      questions: [
        ...config.questions,
        {
          question: '',
          answers: ['', '', '', ''],
          correctAnswer: 0,
          points: 10,
        },
      ],
    })
  }

  const removeQuestion = (index: number) => {
    onChange({
      questions: config.questions.filter((_, i) => i !== index),
    })
  }

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    onChange({
      questions: config.questions.map((q, i) => (i === index ? { ...q, ...updates } : q)),
    })
  }

  const updateAnswer = (qIndex: number, aIndex: number, value: string) => {
    const question = config.questions[qIndex]
    const newAnswers = [...question.answers]
    newAnswers[aIndex] = value
    updateQuestion(qIndex, { answers: newAnswers })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">Quiz Fragen</h4>
        <button
          type="button"
          onClick={addQuestion}
          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded text-sm"
        >
          + Frage hinzufügen
        </button>
      </div>

      {config.questions.map((question, qIndex) => (
        <div key={qIndex} className="bg-white/5 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-gray-400 text-sm">Frage {qIndex + 1}</span>
            <button
              type="button"
              onClick={() => removeQuestion(qIndex)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Löschen
            </button>
          </div>

          <input
            type="text"
            value={question.question}
            onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
            placeholder="Frage eingeben..."
          />

          <div className="space-y-2">
            {question.answers.map((answer, aIndex) => (
              <div key={aIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qIndex}`}
                  checked={question.correctAnswer === aIndex}
                  onChange={() => updateQuestion(qIndex, { correctAnswer: aIndex })}
                  className="w-4 h-4"
                />
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                  placeholder={`Antwort ${aIndex + 1}`}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-gray-400">Punkte</label>
            <input
              type="number"
              value={question.points}
              onChange={(e) => updateQuestion(qIndex, { points: parseInt(e.target.value) || 0 })}
              className="w-24 px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-sm"
              min="0"
            />
          </div>
        </div>
      ))}

      {config.questions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          Noch keine Fragen. Klicke auf &quot;+ Frage hinzufügen&quot;
        </div>
      )}
    </div>
  )
}

// Memory Templates
const MEMORY_TEMPLATES = {
  weihnachten: {
    name: 'Weihnachten',
    icon: '🎄',
    pairs: [
      { id: 1, content: '🎄' },
      { id: 2, content: '⭐' },
      { id: 3, content: '🎁' },
      { id: 4, content: '🔔' },
      { id: 5, content: '❄️' },
      { id: 6, content: '🎅' },
    ],
  },
  silvester: {
    name: 'Silvester',
    icon: '🎆',
    pairs: [
      { id: 1, content: '🎆' },
      { id: 2, content: '🎊' },
      { id: 3, content: '🥂' },
      { id: 4, content: '🎉' },
      { id: 5, content: '🍾' },
      { id: 6, content: '🎇' },
    ],
  },
  ostern: {
    name: 'Ostern',
    icon: '🐰',
    pairs: [
      { id: 1, content: '🐰' },
      { id: 2, content: '🥚' },
      { id: 3, content: '🐣' },
      { id: 4, content: '🌷' },
      { id: 5, content: '🌸' },
      { id: 6, content: '🌼' },
    ],
  },
  geburtstag: {
    name: 'Geburtstag',
    icon: '🎂',
    pairs: [
      { id: 1, content: '🎂' },
      { id: 2, content: '🎈' },
      { id: 3, content: '🎁' },
      { id: 4, content: '🎉' },
      { id: 5, content: '🎊' },
      { id: 6, content: '🎀' },
    ],
  },
  halloween: {
    name: 'Halloween',
    icon: '🎃',
    pairs: [
      { id: 1, content: '🎃' },
      { id: 2, content: '👻' },
      { id: 3, content: '🦇' },
      { id: 4, content: '🕷️' },
      { id: 5, content: '🕸️' },
      { id: 6, content: '🍬' },
    ],
  },
  sommer: {
    name: 'Sommer',
    icon: '☀️',
    pairs: [
      { id: 1, content: '☀️' },
      { id: 2, content: '🏖️' },
      { id: 3, content: '🌊' },
      { id: 4, content: '🍉' },
      { id: 5, content: '🍦' },
      { id: 6, content: '🏄' },
    ],
  },
}

// Memory Config Editor
function MemoryConfigEditor({
  config,
  onChange,
}: {
  config: MemoryConfig
  onChange: (config: MemoryConfig) => void
}) {
  const loadTemplate = (templateKey: keyof typeof MEMORY_TEMPLATES) => {
    onChange({ pairs: MEMORY_TEMPLATES[templateKey].pairs })
  }

  const addPair = () => {
    const newId = Math.max(0, ...config.pairs.map((p) => p.id)) + 1
    onChange({
      pairs: [...config.pairs, { id: newId, content: '' }],
    })
  }

  const removePair = (id: number) => {
    onChange({
      pairs: config.pairs.filter((p) => p.id !== id),
    })
  }

  const updatePair = (id: number, content: string) => {
    onChange({
      pairs: config.pairs.map((p) => (p.id === id ? { ...p, content } : p)),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">Memory Paare</h4>
        <button
          type="button"
          onClick={addPair}
          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded text-sm"
        >
          + Paar hinzufügen
        </button>
      </div>

      {/* Templates */}
      <div>
        <label className="text-sm text-gray-400 block mb-2">Vorlage laden:</label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(MEMORY_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              type="button"
              onClick={() => loadTemplate(key as keyof typeof MEMORY_TEMPLATES)}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
              title={template.name}
            >
              <div className="text-2xl mb-1">{template.icon}</div>
              <div className="text-xs text-gray-400">{template.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {config.pairs.map((pair) => (
          <div key={pair.id} className="bg-white/5 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Paar {pair.id}</span>
              <button
                type="button"
                onClick={() => removePair(pair.id)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={pair.content}
              onChange={(e) => updatePair(pair.id, e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-center text-2xl"
              placeholder="🎄"
            />
          </div>
        ))}
      </div>

      {config.pairs.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          Noch keine Paare. Klicke auf &quot;+ Paar hinzufügen&quot;
        </div>
      )}

      <div className="text-xs text-gray-400 bg-blue-500/10 border border-blue-500/20 rounded p-3">
        💡 Tipp: Verwende Emojis oder kurze Texte. Empfohlen: 6-8 Paare
      </div>
    </div>
  )
}

// Word Config Editor
function WordConfigEditor({
  config,
  onChange,
}: {
  config: WordConfig
  onChange: (config: WordConfig) => void
}) {
  const addWord = () => {
    onChange({
      words: [
        ...config.words,
        {
          scrambled: '',
          answer: '',
          hint: '',
          points: 20,
        },
      ],
    })
  }

  const removeWord = (index: number) => {
    onChange({
      words: config.words.filter((_, i) => i !== index),
    })
  }

  const updateWord = (index: number, updates: Partial<WordPuzzle>) => {
    onChange({
      words: config.words.map((w, i) => (i === index ? { ...w, ...updates } : w)),
    })
  }

  const scrambleWord = (index: number) => {
    const word = config.words[index]
    if (!word.answer) return

    const letters = word.answer.split('')
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }
    updateWord(index, { scrambled: letters.join('') })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">Wörter-Rätsel</h4>
        <button
          type="button"
          onClick={addWord}
          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded text-sm"
        >
          + Wort hinzufügen
        </button>
      </div>

      {config.words.map((word, index) => (
        <div key={index} className="bg-white/5 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-gray-400 text-sm">Wort {index + 1}</span>
            <button
              type="button"
              onClick={() => removeWord(index)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Löschen
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Lösung</label>
              <input
                type="text"
                value={word.answer}
                onChange={(e) => updateWord(index, { answer: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white uppercase"
                placeholder="SILVESTER"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Durcheinander</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={word.scrambled}
                  onChange={(e) => updateWord(index, { scrambled: e.target.value.toUpperCase() })}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white uppercase"
                  placeholder="LSEIRVEST"
                />
                <button
                  type="button"
                  onClick={() => scrambleWord(index)}
                  className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded text-sm"
                  title="Automatisch mischen"
                >
                  🔀
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Hinweis</label>
            <input
              type="text"
              value={word.hint || ''}
              onChange={(e) => updateWord(index, { hint: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
              placeholder="z.B. Letzter Tag des Jahres"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400">Max. Punkte</label>
            <input
              type="number"
              value={word.points}
              onChange={(e) => updateWord(index, { points: parseInt(e.target.value) || 0 })}
              className="w-24 px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-sm"
              min="0"
            />
          </div>
        </div>
      ))}

      {config.words.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          Noch keine Wörter. Klicke auf &quot;+ Wort hinzufügen&quot;
        </div>
      )}

      <div className="text-xs text-gray-400 bg-blue-500/10 border border-blue-500/20 rounded p-3">
        💡 Tipp: Nach 10 Sekunden verliert der Spieler 1 Punkt pro Sekunde. Empfohlen: 20 Punkte max.
      </div>
    </div>
  )
}

// Chat Typing Config Editor
const CHAT_TYPING_CONFIG = {
  DEFAULT_DURATION: 60,
  MIN_DURATION: 10,
  MAX_DURATION: 300,
  RECOMMENDED_MIN: 30,
  RECOMMENDED_MAX: 120,
  PENALTY_SECONDS: 3,
} as const

function ChatTypingConfigEditor({
  config,
  onChange,
}: {
  config: ChatTypingConfig
  onChange: (config: ChatTypingConfig) => void
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white">Chat Typing Race Einstellungen</h4>

      <div>
        <label className="block text-sm text-gray-300 mb-2">
          Spieldauer (in Sekunden)
        </label>
        <input
          type="number"
          value={config.duration}
          onChange={(e) => onChange({ duration: parseInt(e.target.value) || CHAT_TYPING_CONFIG.DEFAULT_DURATION })}
          className="w-32 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={CHAT_TYPING_CONFIG.MIN_DURATION}
          max={CHAT_TYPING_CONFIG.MAX_DURATION}
        />
        <p className="text-xs text-gray-400 mt-1">
          Empfohlen: {CHAT_TYPING_CONFIG.RECOMMENDED_MIN}-{CHAT_TYPING_CONFIG.RECOMMENDED_MAX} Sekunden
        </p>
      </div>

      <div className="text-xs text-gray-400 bg-blue-500/10 border border-blue-500/20 rounded p-3">
        💡 Die Spieler müssen in der vorgegebenen Zeit so viele Nachrichten wie möglich korrekt beantworten. Bei falschen Antworten gibt es eine Zeitstrafe von {CHAT_TYPING_CONFIG.PENALTY_SECONDS} Sekunden.
      </div>
    </div>
  )
}
