'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QuizData, QuizQuestion } from '@/lib/puzzles/quiz-data'

interface QuizEditorProps {
  roomId: string
  currentQuizData?: QuizData | null
  onSave: () => void
}

export default function QuizEditor({ roomId, currentQuizData, onSave }: QuizEditorProps) {
  const [quizTitle, setQuizTitle] = useState(currentQuizData?.title || 'Lustiges Wissensquiz')
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    currentQuizData?.questions || [
      {
        id: 'q1',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 10,
      },
    ]
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const addQuestion = () => {
    const newId = `q${questions.length + 1}`
    setQuestions([
      ...questions,
      {
        id: newId,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 10,
      },
    ])
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      setError('Mindestens eine Frage erforderlich')
      return
    }
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions]
    updated[qIndex].options[oIndex] = value
    setQuestions(updated)
  }

  const handleSave = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) {
        setError(`Frage ${i + 1}: Frage darf nicht leer sein`)
        return
      }
      if (q.options.some((o) => !o.trim())) {
        setError(`Frage ${i + 1}: Alle Antwortoptionen müssen ausgefüllt sein`)
        return
      }
    }

    setError('')
    setIsSaving(true)

    const quizData: QuizData = {
      title: quizTitle,
      description: '',
      questions: questions.map((q, i) => ({
        ...q,
        id: `q${i + 1}`,
      })),
    }

    const supabase = createClient()
    // @ts-ignore
    const { error: updateError } = await supabase
      .from('rooms')
      .update({ quiz_data: quizData })
      .eq('id', roomId)

    if (updateError) {
      setError('Speichern fehlgeschlagen: ' + updateError.message)
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onSave()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Quiz bearbeiten</h3>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {isSaving ? 'Speichere...' : 'Quiz speichern'}
        </button>
      </div>

      {/* Quiz Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quiz-Titel
        </label>
        <input
          type="text"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="z.B. Lustiges Wissensquiz"
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, qIndex) => (
          <div
            key={qIndex}
            className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">
                Frage {qIndex + 1}
              </h4>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded text-sm transition-all"
                >
                  Löschen
                </button>
              )}
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Frage
              </label>
              <input
                type="text"
                value={question.question}
                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Deine Frage..."
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={question.correctAnswer === oIndex}
                    onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                    className="w-4 h-4 text-green-500"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={`Antwort ${String.fromCharCode(65 + oIndex)}`}
                  />
                </div>
              ))}
            </div>

            {/* Points */}
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-300">Punkte:</label>
              <input
                type="number"
                value={question.points}
                onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                min="1"
                max="100"
                className="w-20 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-400">
                ✓ Richtige Antwort ist markiert mit Radio-Button
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Question Button */}
      <button
        type="button"
        onClick={addQuestion}
        className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg transition-all"
      >
        + Weitere Frage hinzufügen
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 Tipp: Markiere die richtige Antwort mit dem Radio-Button links neben der Option
        </p>
      </div>
    </div>
  )
}
