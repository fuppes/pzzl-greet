'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserFriendlyMessage, logError } from '@/lib/error-handler'

interface GreetingPageProps {
  sessionId: string
  playerId: string
  playerName: string
  videoUrl?: string | null
  roomId?: string
}

export default function GreetingPage({ sessionId, playerId, playerName, videoUrl, roomId }: GreetingPageProps) {
  const [videoError, setVideoError] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [messageSent, setMessageSent] = useState(false)
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const emojis = ['🎉', '❤️', '🔥', '⭐', '🎊', '👏', '🙌', '💯', '✨', '🎈', '🌟', '💝']

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      if (videoRef.current) {
        const video = videoRef.current
        video.srcObject = stream
        streamRef.current = stream

        // Set isCapturing immediately so video element is visible
        setIsCapturing(true)

        // Try to play immediately
        try {
          await video.play()
        } catch (playError) {
          // Fallback: wait for metadata
          video.onloadedmetadata = async () => {
            try {
              await video.play()
            } catch (e) {
              console.error('Play failed:', e)
            }
          }
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      alert('Kamera konnte nicht geöffnet werden. Bitte erlaube den Kamera-Zugriff.')
      setIsCapturing(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
  }

  const takeSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Mirror the image (flip horizontally)
    context.translate(canvas.width, 0)
    context.scale(-1, 1)

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Reset transformation
    context.setTransform(1, 0, 0, 1, 0, 0)

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setSelfieDataUrl(dataUrl)

    // Stop camera
    stopCamera()
  }

  const removeSelfie = () => {
    setSelfieDataUrl(null)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Bitte wähle ein Bild aus')
      return
    }

    // Read file and convert to data URL
    const reader = new FileReader()
    reader.onload = (event) => {
      setSelfieDataUrl(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedEmoji && !selfieDataUrl) return
    if (!roomId) return

    setIsUploading(true)

    try {
      const supabase = createClient()
      let selfieUrl = null

      // Upload selfie if exists
      if (selfieDataUrl) {
        // Convert data URL to blob
        const response = await fetch(selfieDataUrl)
        const blob = await response.blob()

        // Create unique filename
        const filename = `${sessionId}_${playerId}_${Date.now()}.jpg`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('player-selfies')
          .upload(filename, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('player-selfies')
          .getPublicUrl(uploadData.path)

        selfieUrl = urlData.publicUrl
      }

      // Insert message
      const { error } = await supabase.from('player_messages').insert({
        session_id: sessionId,
        player_id: playerId,
        room_id: roomId,
        message: message.trim() || '(Nur Emoji)',
        emoji: selectedEmoji || null,
        selfie_url: selfieUrl,
      })

      if (error) throw error

      setMessageSent(true)
      setMessage('')
      setSelectedEmoji('')
      setSelfieDataUrl(null)
    } catch (err) {
      logError(err as Error, 'handleSendMessage')
      alert(getUserFriendlyMessage(err as Error))
    } finally {
      setIsUploading(false)
    }
  }

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

      {/* Message/Feedback Section */}
      {roomId && (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-white mb-1">
              Schick eine Nachricht! 💌
            </h3>
            <p className="text-sm text-gray-300">
              Hinterlasse dem Spielersteller ein nettes Feedback oder einen Gruß
            </p>
          </div>

          {messageSent ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-6xl">✨</div>
              <p className="text-xl font-semibold text-green-400">Nachricht gesendet!</p>
              <p className="text-sm text-gray-400">Deine Nachricht wurde übermittelt</p>
              <button
                onClick={() => setMessageSent(false)}
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Noch eine Nachricht senden
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Emoji Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wähle ein Emoji (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji === selectedEmoji ? '' : emoji)}
                      className={`text-3xl p-2 rounded-lg transition-all transform hover:scale-110 ${
                        selectedEmoji === emoji
                          ? 'bg-purple-500/40 ring-2 ring-purple-400 scale-110'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deine Nachricht
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="z.B. Super Spiel! Hat richtig Spaß gemacht 🎉"
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">{message.length}/500 Zeichen</p>
                  {selectedEmoji && (
                    <p className="text-xs text-purple-400">Ausgewähltes Emoji: {selectedEmoji}</p>
                  )}
                </div>
              </div>

              {/* Selfie Section */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selfie hinzufügen (optional) 📸
                </label>

                {!selfieDataUrl && !isCapturing && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-2xl">📷</span>
                      <span>Selfie mit Webcam aufnehmen</span>
                    </button>

                    <div className="text-center text-xs text-gray-500">oder</div>

                    <label className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer">
                      <span className="text-2xl">🖼️</span>
                      <span>Bild hochladen</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {isCapturing && (
                  <div className="space-y-3">
                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '320px' }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                        style={{ minHeight: '320px', backgroundColor: '#000' }}
                      />
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        ● LIVE
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        Kamera aktiv - Falls kein Bild: Browser-Einstellungen prüfen
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={takeSelfie}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all"
                      >
                        📸 Foto aufnehmen
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all"
                      >
                        ✕ Abbrechen
                      </button>
                    </div>
                  </div>
                )}

                {selfieDataUrl && (
                  <div className="space-y-3">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <img
                        src={selfieDataUrl}
                        alt="Selfie Preview"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={removeSelfie}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all"
                      >
                        🗑️ Selfie entfernen
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeSelfie()
                          startCamera()
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all"
                      >
                        🔄 Neu aufnehmen
                      </button>
                    </div>
                  </div>
                )}

                {/* Hidden canvas for capturing */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={(!message.trim() && !selectedEmoji && !selfieDataUrl) || isUploading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-purple-500/30"
              >
                {isUploading ? 'Wird gesendet...' : 'Nachricht senden ✉️'}
              </button>
            </div>
          )}
        </div>
      )}

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
